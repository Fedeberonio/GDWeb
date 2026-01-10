// Script para cambiar configuración en Render Dashboard
// Ejecutar en la consola del navegador en: https://dashboard.render.com/web/srv-d4119qvgi27c73erggj0/settings

// Buscar y cambiar Root Directory
const rootDirInput = document.querySelector('input[name*="root" i], input[placeholder*="root" i], input[aria-label*="Root Directory" i]');
if (rootDirInput) {
  rootDirInput.value = '';
  rootDirInput.dispatchEvent(new Event('input', { bubbles: true }));
  rootDirInput.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('✅ Root Directory cambiado a vacío');
} else {
  console.log('⚠️ No se encontró el campo Root Directory');
}

// Buscar y cambiar Dockerfile Path
const dockerfileInput = document.querySelector('input[name*="dockerfile" i], input[placeholder*="dockerfile" i], input[aria-label*="Dockerfile" i]');
if (dockerfileInput) {
  dockerfileInput.value = 'Dockerfile';
  dockerfileInput.dispatchEvent(new Event('input', { bubbles: true }));
  dockerfileInput.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('✅ Dockerfile Path cambiado a "Dockerfile"');
} else {
  console.log('⚠️ No se encontró el campo Dockerfile Path');
}

// Buscar y cambiar Docker Context
const dockerContextInput = document.querySelector('input[name*="context" i], input[placeholder*="context" i], input[aria-label*="Context" i]');
if (dockerContextInput) {
  dockerContextInput.value = '.';
  dockerContextInput.dispatchEvent(new Event('input', { bubbles: true }));
  dockerContextInput.dispatchEvent(new Event('change', { bubbles: true }));
  console.log('✅ Docker Context cambiado a "."');
} else {
  console.log('⚠️ No se encontró el campo Docker Context');
}

// Buscar botón de guardar
const saveButton = document.querySelector('button[type="submit"], button:contains("Save"), button:contains("Update")');
if (saveButton) {
  console.log('✅ Botón de guardar encontrado:', saveButton);
  // NO hacer clic automáticamente por seguridad
  console.log('⚠️ Haz clic manualmente en el botón de guardar');
} else {
  console.log('⚠️ No se encontró el botón de guardar');
}

console.log('📋 Script ejecutado. Revisa los resultados arriba.');
