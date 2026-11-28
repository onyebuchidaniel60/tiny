package ng.tiny.education.core.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import net.zetetic.database.sqlcipher.SupportOpenHelperFactory
import ng.tiny.education.core.security.DatabaseKeyProvider

@Database(
    entities = [
        WorkspaceEntity::class,
        ClassroomEntity::class,
        PupilEntity::class,
        GuardianEntity::class,
        PupilGuardianLinkEntity::class,
        AttendanceSessionEntity::class,
        AttendanceEntryEntity::class,
        LessonPlanEntity::class,
        ProgressEntryEntity::class,
        ConversationEntity::class,
        MessageEntity::class,
        OutboxCommandEntity::class,
        SyncCursorEntity::class,
        AuditEventEntity::class,
        AssessmentEntity::class,
        FollowUpEntity::class,
        AiAnalysisEntity::class,
    ],
    version = 2,
    exportSchema = false,
)
@TypeConverters(Converters::class)
abstract class TinyDatabase : RoomDatabase() {
    abstract fun dao(): TinyDao

    companion object {
        private const val DATABASE_NAME = "tiny.db"

        val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL(
                    "CREATE TABLE IF NOT EXISTS assessments (" +
                        "id TEXT NOT NULL PRIMARY KEY, workspaceId TEXT NOT NULL, classId TEXT NOT NULL, " +
                        "pupilId TEXT NOT NULL, subjectId TEXT NOT NULL, objectiveId TEXT NOT NULL, " +
                        "objectiveLabel TEXT NOT NULL, score REAL NOT NULL, maxScore REAL NOT NULL, " +
                        "schoolDate TEXT NOT NULL, teacherNote TEXT NOT NULL, createdAt INTEGER NOT NULL, " +
                        "updatedAt INTEGER NOT NULL, syncState TEXT NOT NULL)",
                )
                database.execSQL("CREATE INDEX IF NOT EXISTS index_assessments_workspaceId ON assessments(workspaceId)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_assessments_classId ON assessments(classId)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_assessments_pupilId ON assessments(pupilId)")
                database.execSQL(
                    "CREATE TABLE IF NOT EXISTS follow_ups (" +
                        "id TEXT NOT NULL PRIMARY KEY, workspaceId TEXT NOT NULL, classId TEXT NOT NULL, " +
                        "pupilId TEXT, title TEXT NOT NULL, detail TEXT NOT NULL, dueDate TEXT NOT NULL, " +
                        "status TEXT NOT NULL, source TEXT NOT NULL, sourceId TEXT, createdAt INTEGER NOT NULL, " +
                        "completedAt INTEGER, syncState TEXT NOT NULL)",
                )
                database.execSQL("CREATE INDEX IF NOT EXISTS index_follow_ups_workspaceId ON follow_ups(workspaceId)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_follow_ups_classId ON follow_ups(classId)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_follow_ups_pupilId ON follow_ups(pupilId)")
                database.execSQL(
                    "CREATE TABLE IF NOT EXISTS ai_analyses (" +
                        "id TEXT NOT NULL PRIMARY KEY, workspaceId TEXT NOT NULL, scope TEXT NOT NULL, " +
                        "task TEXT NOT NULL, pupilId TEXT, classId TEXT, evidenceFingerprint TEXT NOT NULL, " +
                        "evidenceIdsJson TEXT NOT NULL, evidenceSummary TEXT NOT NULL, output TEXT NOT NULL, " +
                        "requestedMode TEXT NOT NULL, source TEXT NOT NULL, durationMs INTEGER NOT NULL, " +
                        "fallback INTEGER NOT NULL, status TEXT NOT NULL, createdAt INTEGER NOT NULL)",
                )
                database.execSQL("CREATE INDEX IF NOT EXISTS index_ai_analyses_workspaceId ON ai_analyses(workspaceId)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_ai_analyses_pupilId ON ai_analyses(pupilId)")
                database.execSQL("CREATE INDEX IF NOT EXISTS index_ai_analyses_classId ON ai_analyses(classId)")
            }
        }

        fun build(context: Context, keyProvider: DatabaseKeyProvider): TinyDatabase {
            System.loadLibrary("sqlcipher")
            val passphrase = keyProvider.getOrCreatePassphrase()
            return Room.databaseBuilder(
                context.applicationContext,
                TinyDatabase::class.java,
                DATABASE_NAME,
            )
                .openHelperFactory(SupportOpenHelperFactory(passphrase))
                .addMigrations(MIGRATION_1_2)
                .build()
        }
    }
}
