package ng.tiny.education.core.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
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
    ],
    version = 1,
    exportSchema = false,
)
@TypeConverters(Converters::class)
abstract class TinyDatabase : RoomDatabase() {
    abstract fun dao(): TinyDao

    companion object {
        private const val DATABASE_NAME = "tiny.db"

        fun build(context: Context, keyProvider: DatabaseKeyProvider): TinyDatabase {
            System.loadLibrary("sqlcipher")
            val passphrase = keyProvider.getOrCreatePassphrase()
            return Room.databaseBuilder(
                context.applicationContext,
                TinyDatabase::class.java,
                DATABASE_NAME,
            )
                .openHelperFactory(SupportOpenHelperFactory(passphrase))
                .build()
        }
    }
}
