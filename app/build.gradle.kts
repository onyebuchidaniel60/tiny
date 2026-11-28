plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

if (file("google-services.json").exists()) {
    apply(plugin = "com.google.gms.google-services")
}

android {
    namespace = "ng.tiny.education"
    compileSdk = 36

    defaultConfig {
        applicationId = "ng.tiny.education"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables.useSupportLibrary = true

        buildConfigField("boolean", "MOCK_SERVICES", "true")
        buildConfigField("String", "ENVIRONMENT", "\"dev\"")
        buildConfigField("String", "FIREBASE_PROJECT_ID", "\"tiny-b9f29\"")
        buildConfigField("String", "FUNCTIONS_REGION", "\"africa-south1\"")
        buildConfigField("boolean", "FIREBASE_CONFIGURED", file("google-services.json").exists().toString())
        buildConfigField("String", "CLOUD_MODEL_NAME", "\"gemini-3.5-flash-lite\"")
        buildConfigField("boolean", "FUNCTIONS_EMULATOR", (project.findProperty("functionsEmulator")?.toString()?.toBoolean() ?: false).toString())
    }

    flavorDimensions += "environment"
    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "ENVIRONMENT", "\"dev\"")
        }
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            buildConfigField("String", "ENVIRONMENT", "\"staging\"")
        }
    }

    // CI debug APKs normally get a fresh debug keystore on every runner, so a
    // newer download cannot upgrade an older install. Supplying a stable
    // keystore makes repeated installs predictable; the file is never
    // committed. Without it, Android's default debug signing is unchanged.
    val stableDebugKeystorePath = System.getenv("TINY_DEBUG_KEYSTORE_PATH")
    val stableDebugKeystore = stableDebugKeystorePath?.takeIf { file(it).exists() }
    signingConfigs {
        if (stableDebugKeystore != null) {
            create("stableDebug") {
                storeFile = file(stableDebugKeystore)
                storePassword = System.getenv("TINY_DEBUG_KEYSTORE_PASSWORD") ?: "android"
                keyAlias = System.getenv("TINY_DEBUG_KEY_ALIAS") ?: "androiddebugkey"
                keyPassword = System.getenv("TINY_DEBUG_KEY_PASSWORD") ?: "android"
            }
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isMinifyEnabled = false
            if (stableDebugKeystore != null) {
                signingConfig = signingConfigs.getByName("stableDebug")
            }
        }
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        compilerOptions {
            jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
        }
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }

    testOptions {
        unitTests.isReturnDefaultValues = true
    }

    lint {
        abortOnError = true
        warningsAsErrors = false
        // Every locale now defines the same string/plural keys. Native language
        // review remains a separate content-quality gate; see docs/LOCALIZATION.md.
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.core.splashscreen)
    implementation(libs.androidx.appcompat)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.viewmodel.ktx)
    implementation(libs.androidx.navigation.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons.core)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)
    implementation(libs.androidx.sqlite)
    implementation(libs.sqlcipher)

    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.work.runtime.ktx)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.coroutines.play.services)

    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.auth)
    implementation(libs.firebase.firestore)
    implementation(libs.firebase.functions)
    implementation(libs.firebase.appcheck.debug)
    implementation(libs.firebase.appcheck.playintegrity)
    implementation(libs.firebase.ai)
    implementation(libs.firebase.ai.ondevice)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.json)

    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.compose.bom))
    androidTestImplementation(libs.compose.ui.test.junit4)

    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)
}
