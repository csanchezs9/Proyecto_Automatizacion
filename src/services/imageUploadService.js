const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class ImageUploadService {
  constructor() {
    // Inicializar cliente de Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    // Usar service_role_key para operaciones de backend (más permisos)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Se requieren SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.bucketName = 'imagenes';
  }

  /**
   * Sube una imagen al bucket de Supabase Storage
   * @param {Buffer|File} imageFile - El archivo de imagen
   * @param {string} fileName - Nombre del archivo (sin extensión)
   * @param {string} mimeType - Tipo MIME del archivo (image/jpeg, image/png, etc.)
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadImage(imageFile, fileName, mimeType = 'image/jpeg') {
    try {
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const extension = this.getExtensionFromMimeType(mimeType);
      const uniqueFileName = `${fileName}_${timestamp}${extension}`;
      const filePath = `products/${uniqueFileName}`;

      // Validar tipo de archivo
      if (!this.isValidImageType(mimeType)) {
        return {
          success: false,
          error: 'Tipo de archivo no válido. Solo se permiten imágenes JPG, PNG, WEBP y GIF'
        };
      }

      // Validar tamaño del archivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const fileSize = imageFile?.length || imageFile?.size || 0;
      
      if (fileSize > maxSize) {
        return {
          success: false,
          error: 'El archivo es muy grande. Tamaño máximo: 5MB'
        };
      }

      // Subir archivo a Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, imageFile, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error al subir imagen a Supabase:', error);
        return {
          success: false,
          error: `Error al subir imagen: ${error.message}`
        };
      }

      // Obtener URL pública del archivo
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        return {
          success: false,
          error: 'No se pudo obtener la URL pública de la imagen'
        };
      }

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: uniqueFileName,
        filePath: filePath
      };

    } catch (error) {
      console.error('Error inesperado al subir imagen:', error);
      return {
        success: false,
        error: `Error inesperado: ${error.message}`
      };
    }
  }

  /**
   * Elimina una imagen del bucket de Supabase Storage
   * @param {string} filePath - Ruta del archivo en el bucket
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async deleteImage(filePath) {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Error al eliminar imagen:', error);
        return {
          success: false,
          error: `Error al eliminar imagen: ${error.message}`
        };
      }

      return { success: true };

    } catch (error) {
      console.error('Error inesperado al eliminar imagen:', error);
      return {
        success: false,
        error: `Error inesperado: ${error.message}`
      };
    }
  }

  /**
   * Lista todas las imágenes en el bucket
   * @returns {Promise<{success: boolean, files?: Array, error?: string}>}
   */
  async listImages() {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list('products', {
          limit: 100,
          offset: 0
        });

      if (error) {
        return {
          success: false,
          error: `Error al listar imágenes: ${error.message}`
        };
      }

      return {
        success: true,
        files: data || []
      };

    } catch (error) {
      console.error('Error inesperado al listar imágenes:', error);
      return {
        success: false,
        error: `Error inesperado: ${error.message}`
      };
    }
  }

  /**
   * Extrae el path de archivo desde una URL de Supabase Storage
   * @param {string} imageUrl - URL completa de la imagen
   * @returns {string|null} - El path del archivo o null si no es válido
   */
  extractFilePathFromUrl(imageUrl) {
    try {
      if (!imageUrl || !imageUrl.includes('/storage/v1/object/public/')) {
        return null;
      }

      const parts = imageUrl.split('/storage/v1/object/public/');
      if (parts.length !== 2) {
        return null;
      }

      const pathPart = parts[1];
      const bucketAndPath = pathPart.split('/');
      
      if (bucketAndPath[0] !== this.bucketName) {
        return null;
      }

      // Remover el nombre del bucket y devolver solo el path
      return bucketAndPath.slice(1).join('/');
    } catch (error) {
      console.error('Error al extraer path de URL:', error);
      return null;
    }
  }

  /**
   * Valida si el tipo MIME es válido para imágenes
   * @param {string} mimeType - Tipo MIME a validar
   * @returns {boolean}
   */
  isValidImageType(mimeType) {
    const validTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    return validTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Obtiene la extensión de archivo desde el tipo MIME
   * @param {string} mimeType - Tipo MIME
   * @returns {string} - Extensión del archivo
   */
  getExtensionFromMimeType(mimeType) {
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };
    return mimeToExt[mimeType.toLowerCase()] || '.jpg';
  }

  /**
   * Procesa un archivo de imagen desde form-data
   * @param {Object} file - Objeto file desde express-fileupload
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async processUploadedFile(file) {
    if (!file) {
      return {
        success: false,
        error: 'No se proporcionó ningún archivo'
      };
    }

    // Generar nombre base desde el nombre original del archivo
    const originalName = file.name || 'image';
    const baseName = path.parse(originalName).name;
    
    return await this.uploadImage(file.data, baseName, file.mimetype);
  }
}

module.exports = ImageUploadService;