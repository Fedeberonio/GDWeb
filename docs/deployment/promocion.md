# Promoción a Producción

## Proceso de Promoción

### Pre-requisitos

1. ✅ Deploy en staging exitoso
2. ✅ Testing completo en staging
3. ✅ Verificación de funcionalidades críticas
4. ✅ Revisión de código aprobada

### Pasos para Promover

1. **Verificar Estado de Staging**
   ```bash
   # Verificar que staging funciona correctamente
   curl https://staging-url.vercel.app/api/health
   ```

2. **Merge a Main**
   ```bash
   git checkout main
   git merge test-build
   git push origin main
   ```

3. **Configurar Producción en Vercel**
   - Ir a Vercel Dashboard
   - Seleccionar proyecto
   - Configurar branch `main` para producción
   - Verificar variables de entorno de producción

4. **Deploy a Producción**
   - El deploy se activa automáticamente al hacer push a `main`
   - O manualmente desde Vercel Dashboard

5. **Verificación Post-Deploy**
   - Verificar que la aplicación funciona
   - Verificar que las variables de entorno están correctas
   - Verificar que no hay errores en logs

## Rollback

Si es necesario hacer rollback:

1. Ir a Vercel Dashboard
2. Seleccionar el deployment anterior
3. Hacer "Promote to Production"

## Notas

- Siempre promover desde staging después de testing completo
- Mantener staging y producción sincronizados en configuración
- Documentar cualquier cambio en variables de entorno
