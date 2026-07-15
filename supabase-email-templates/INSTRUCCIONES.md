# Instrucciones para la Plantilla de Correo de Recuperación de Contraseña

Para aplicar el nuevo diseño de correo de recuperación de contraseña de **Maverlang** en tu entorno de producción de Supabase, sigue estos sencillos pasos:

1. **Ingresa a la Consola de Supabase**:
   * Dirígete a [supabase.com/dashboard](https://supabase.com/dashboard) e inicia sesión.
   * Selecciona tu proyecto actual.

2. **Navega a la Configuración de Autenticación**:
   * En el menú lateral izquierdo, haz clic en **Authentication** (icono de candado/usuario).
   * Selecciona la opción **Email Templates** en la lista de pestañas secundarias.

3. **Edita la Plantilla de Recuperación**:
   * Busca la sección llamada **Reset password** (Restablecer contraseña).
   * Configura los siguientes campos:
     * **Subject (Asunto)**: `Restablece tu contraseña de Maverlang 🔐` (o el texto que prefieras).
     * **Body (Cuerpo)**: Abre el archivo [reset-password.html](file:///c:/Users/manue/OneDrive/Desktop/Noticias/newsbi-pulse/supabase-email-templates/reset-password.html), copia todo su contenido e insértalo en esta área de texto, reemplazando la plantilla actual.

4. **Guarda los Cambios**:
   * Haz clic en el botón **Save** en la parte inferior derecha de la tarjeta.

¡Listo! Todos los correos de recuperación de contraseña enviados por Supabase a partir de ahora tendrán el nuevo diseño institucional de Maverlang con el formato responsivo premium.
