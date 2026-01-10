// ============================================
// SCRIPT PARA CAMBIAR CONFIGURACIÓN EN RENDER
// ============================================
// INSTRUCCIONES:
// 1. Ve a: https://dashboard.render.com/web/srv-d4119qvgi27c73erggj0/settings
// 2. Abre la consola del navegador (F12 o Cmd+Option+I)
// 3. Espera a que la página cargue completamente (5-10 segundos)
// 4. Copia y pega TODO este script en la consola
// 5. Presiona Enter
// 6. Revisa los resultados en la consola
// 7. Si encuentra los campos, busca el botón "Save" y haz clic manualmente

console.log('🚀 Iniciando búsqueda de campos de configuración...');

// Esperar un momento para que la página cargue completamente
setTimeout(() => {
  // Buscar todos los inputs posibles
  const allInputs = Array.from(document.querySelectorAll('input'));
  const allTextareas = Array.from(document.querySelectorAll('textarea'));
  const allFields = [...allInputs, ...allTextareas];
  
  console.log(`📊 Total de campos encontrados: ${allFields.length}`);
  
  let rootDirFound = false;
  let dockerfileFound = false;
  let contextFound = false;
  
  // Buscar Root Directory
  allFields.forEach((field, index) => {
    try {
      const label = field.closest('label')?.textContent || '';
      const placeholder = field.placeholder || '';
      const name = field.name || '';
      const id = field.id || '';
      const ariaLabel = field.getAttribute('aria-label') || '';
      const parentText = field.parentElement?.textContent || '';
      
      const searchText = (label + placeholder + name + id + ariaLabel + parentText).toLowerCase();
      
      if (searchText.includes('root') && (searchText.includes('directory') || searchText.includes('dir'))) {
        console.log(`✅ ENCONTRADO Root Directory en campo #${index}:`, field);
        console.log('   Valor actual:', field.value);
        field.value = '';
        field.focus();
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        rootDirFound = true;
      }
      
      // Buscar Dockerfile Path
      if (searchText.includes('dockerfile') || (searchText.includes('docker') && searchText.includes('file'))) {
        console.log(`✅ ENCONTRADO Dockerfile Path en campo #${index}:`, field);
        console.log('   Valor actual:', field.value);
        field.value = 'Dockerfile';
        field.focus();
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        dockerfileFound = true;
      }
      
      // Buscar Docker Context
      if (searchText.includes('context') && searchText.includes('docker')) {
        console.log(`✅ ENCONTRADO Docker Context en campo #${index}:`, field);
        console.log('   Valor actual:', field.value);
        field.value = '.';
        field.focus();
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));
        contextFound = true;
      }
    } catch (e) {
      // Ignorar errores en campos individuales
    }
  });
  
  // Buscar por valor actual (si tiene "apps/web")
  allFields.forEach((field) => {
    try {
      if (field.value && field.value.includes('apps/web')) {
        console.log(`⚠️ Campo con valor "apps/web" encontrado:`, field);
        console.log('   Intentando cambiar a vacío...');
        field.value = '';
        field.focus();
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        rootDirFound = true;
      }
    } catch (e) {
      // Ignorar errores
    }
  });
  
  // Resumen
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESUMEN DE CAMBIOS:');
  console.log('='.repeat(50));
  console.log(`Root Directory:    ${rootDirFound ? '✅ CAMBIADO' : '❌ NO ENCONTRADO'}`);
  console.log(`Dockerfile Path:   ${dockerfileFound ? '✅ CAMBIADO' : '❌ NO ENCONTRADO'}`);
  console.log(`Docker Context:     ${contextFound ? '✅ CAMBIADO' : '❌ NO ENCONTRADO'}`);
  console.log('='.repeat(50));
  
  // Buscar botón de guardar
  const allButtons = Array.from(document.querySelectorAll('button'));
  const saveButtons = allButtons.filter(btn => {
    const text = btn.textContent.toLowerCase();
    return text.includes('save') || text.includes('update') || text.includes('guardar') || 
           text.includes('apply') || btn.type === 'submit';
  });
  
  if (saveButtons.length > 0) {
    console.log(`\n✅ Encontrados ${saveButtons.length} botón(es) de guardar:`);
    saveButtons.forEach((btn, i) => {
      console.log(`   ${i + 1}. "${btn.textContent.trim()}" -`, btn);
    });
    console.log('\n💡 IMPORTANTE: Haz clic manualmente en el botón de guardar.');
  } else {
    console.log('\n⚠️ No se encontró botón de guardar automáticamente.');
    console.log('   Busca manualmente un botón que diga "Save", "Update" o "Apply"');
  }
  
  // Si no se encontraron campos, mostrar ayuda
  if (!rootDirFound && !dockerfileFound && !contextFound) {
    console.log('\n⚠️ No se encontraron los campos automáticamente.');
    console.log('\n📋 INSTRUCCIONES MANUALES:');
    console.log('1. Busca la sección "Build & Deploy" o "Build Settings"');
    console.log('2. Busca el campo "Root Directory" y cámbialo a vacío');
    console.log('3. Busca el campo "Dockerfile Path" y cámbialo a "Dockerfile"');
    console.log('4. Busca el campo "Docker Context" y cámbialo a "."');
    console.log('5. Haz clic en "Save" o "Update"');
  }
  
}, 2000); // Esperar 2 segundos para que la página cargue

console.log('⏳ Esperando 2 segundos para que la página cargue completamente...');




