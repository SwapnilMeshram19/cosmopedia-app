package expo.modules.cosmogallery

import android.content.ContentValues
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class CosmoGalleryModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CosmoGallery")

    // Copies a local file (file://...) into Pictures/Cosmopedia and returns the saved location.
    // Android 10+ (API 29+): MediaStore insert, no permission needed.
    // Android 9 and below: plain file copy; the JS side requests WRITE_EXTERNAL_STORAGE first.
    AsyncFunction("saveImage") { fileUri: String, mime: String, name: String ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("No Android context")
      val path = Uri.parse(fileUri).path ?: throw IllegalArgumentException("Bad file uri: $fileUri")
      val src = File(path)
      if (!src.exists()) throw IllegalArgumentException("File not found: $path")

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        val resolver = ctx.contentResolver
        val values = ContentValues().apply {
          put(MediaStore.Images.Media.DISPLAY_NAME, name)
          put(MediaStore.Images.Media.MIME_TYPE, mime)
          put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Cosmopedia")
          put(MediaStore.Images.Media.IS_PENDING, 1)
        }
        val collection = MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
        val uri = resolver.insert(collection, values)
          ?: throw IllegalStateException("MediaStore insert failed")
        try {
          val out = resolver.openOutputStream(uri) ?: throw IllegalStateException("Could not open output stream")
          out.use { o -> src.inputStream().use { it.copyTo(o) } }
          values.clear()
          values.put(MediaStore.Images.Media.IS_PENDING, 0)
          resolver.update(uri, values, null, null)
        } catch (e: Exception) {
          resolver.delete(uri, null, null)
          throw e
        }
        uri.toString()
      } else {
        @Suppress("DEPRECATION")
        val dir = File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "Cosmopedia")
        if (!dir.exists() && !dir.mkdirs()) throw IllegalStateException("Could not create ${dir.absolutePath}")
        val dest = File(dir, name)
        src.copyTo(dest, overwrite = true)
        MediaScannerConnection.scanFile(ctx, arrayOf(dest.absolutePath), arrayOf(mime), null)
        dest.absolutePath
      }
    }
  }
}