/* ====== Autenticación con Google ====== */
window.loginRecienIniciado = false;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase no está disponible. Autenticación deshabilitada.');
    return;
  }

  const auth = firebase.auth();
  const provider = new firebase.auth.GoogleAuthProvider();

  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const userInfoContainer = document.getElementById('user-info');
  const userPic = document.getElementById('user-pic');
  const userName = document.getElementById('user-name');

  if (!btnLogin || !btnLogout || !userInfoContainer) return;

  window.userProfile = null;

  const login = () => {
    auth.signInWithPopup(provider)
      .then(result => {
        console.log('Inicio de sesión exitoso', result.user);
        window.loginRecienIniciado = true;
      })
      .catch(error => {
        console.error('Error en el inicio de sesión:', error);
        mostrarNotificacion('Error al iniciar sesión. Por favor, intenta de nuevo.');
      });
  };

  const logout = () => {
    let carritoActual = [];
    try {
      carritoActual = JSON.parse(localStorage.getItem('carrito') || '[]');
    } catch (error) {
      console.warn('No se pudo leer el carrito antes de cerrar sesión:', error);
      carritoActual = [];
    }

    const uid = window.currentUserId || firebase.auth().currentUser?.uid || null;

    const limpiarEstadoLocal = () => {
      localStorage.setItem('carrito', '[]');
      renderCarrito();
    };

    const finalizarLogout = () => {
      limpiarEstadoLocal();
      auth.signOut()
        .then(() => {
          console.log('Sesión cerrada');
          window.loginRecienIniciado = false;
          const lang = obtenerIdiomaActual();
          mostrarNotificacion(lang === 'en' ? 'You have logged out. Come back soon!' : 'Has cerrado sesión. ¡Vuelve pronto!');
        })
        .catch(error => {
          console.error('Error al cerrar sesión:', error);
          mostrarNotificacion('Error al cerrar sesión. Por favor, intenta de nuevo.');
        });
    };

    if (uid) {
      actualizarCarritoUsuario(uid, carritoActual)
        .catch(error => {
          console.error('No se pudo sincronizar el carrito en Firebase al cerrar sesión:', error);
        })
        .finally(finalizarLogout);
    } else {
      finalizarLogout();
    }
  };

  auth.onAuthStateChanged(user => {
    if (user) {
      window.currentUserId = user.uid;
      const db = firebase.firestore();
      const userRef = db.collection('users').doc(user.uid);

      userRef.get().then(doc => {
        if (doc.exists) {
          window.userProfile = doc.data();
          if (window.userProfile.carrito) {
            localStorage.setItem('carrito', JSON.stringify(window.userProfile.carrito));
            renderCarrito();
          }
          if (window.loginRecienIniciado) {
            const lang = obtenerIdiomaActual();
            const nombre = user.displayName || window.userProfile?.displayName || '';
            mostrarNotificacion(lang === 'en'
              ? `Welcome back${nombre ? `, ${nombre}` : ''}!`
              : `¡Bienvenid@ de vuelta${nombre ? `, ${nombre}` : ''}!`);
          }
        } else {
          localStorage.removeItem(`profileSetupClosed_${user.uid}`);
          if (window.loginRecienIniciado) {
            const lang = obtenerIdiomaActual();
            const nombre = user.displayName || '';
            mostrarNotificacion(lang === 'en'
              ? `Welcome${nombre ? `, ${nombre}` : ''}! Please complete your profile.`
              : `¡Bienvenid@${nombre ? `, ${nombre}` : ''}! Completa tu perfil para continuar.`);
          }
          guardarPerfilDeUsuario(user);
        }
        window.loginRecienIniciado = false;
      }).catch(error => {
        console.error('Error al obtener el documento del usuario:', error);
        window.loginRecienIniciado = false;
      });

      btnLogin.style.display = 'none';
      userInfoContainer.style.display = 'flex';
      userPic.src = user.photoURL || '';
      userName.textContent = user.displayName || '';
    } else {
      window.userProfile = null;
      window.currentUserId = null;
      btnLogin.style.display = 'block';
      userInfoContainer.style.display = 'none';
      if (userPic) userPic.src = '';
      if (userName) userName.textContent = '';
    }
  });

  btnLogin.addEventListener('click', login);
  btnLogout.addEventListener('click', logout);

  const btnCerrarProfile = document.getElementById('cerrar-profile-setup');
  if (btnCerrarProfile) {
    btnCerrarProfile.addEventListener('click', () => {
      document.getElementById('profile-setup').classList.add('hidden');
      const uid = window.currentUserId;
      if (uid) {
        localStorage.setItem(`profileSetupClosed_${uid}`, '1');
      } else {
        localStorage.setItem('profileSetupClosed', '1');
      }
      firebase.auth().signOut().then(() => {
        setTimeout(() => localStorage.removeItem('profileSetupClosed'), 300);
      });
    });
  }

  window.iniciarSesion = login;
  window.cerrarSesion = logout;
});

/* ====== preferencias de la caja (global) ====== */
window.preferenciasCaja = { like: [], dislike: [] };
const estadoCajas = {};   /* boxId -> { variedad:null, like:[], dislike:[], ok:false } */
let cajaActual = null;
window.carrito = window.carrito || [];
// ====== Estado del flujo del carrito ====== //
window.estadoFlujoCarrito = "lista";
const DIAS_CON_CARGO = ['Martes', 'Tuesday', 'Jueves', 'Thursday', 'Sábado', 'Saturday'];
const DIA_TRADUCCION_EN = {
  'Lunes': 'Monday',
  'Martes': 'Tuesday',
  'Miércoles': 'Wednesday',
  'Jueves': 'Thursday',
  'Viernes': 'Friday',
  'Sábado': 'Saturday',
  'Domingo': 'Sunday'
};
window.ultimoResumenPedido = null;

function normalizarBoxId(valor) {
  if (valor === null || valor === undefined) return null;
  const str = String(valor).trim();
  if (!str) return null;
  return str.startsWith('box') ? str : `box${str}`;
}

function obtenerNumeroCaja(boxId) {
  const normalizado = normalizarBoxId(boxId);
  return normalizado ? normalizado.replace(/^box/, '') : '';
}

function escaparAttr(valor) {
  return String(valor ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/* ----------  PLANTILLA ORIGINAL DEL DIÁLOGO  ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const dlgCarrito = document.getElementById('dlg-carrito');
  if (!dlgCarrito) return;
  const plantillaCarrito = dlgCarrito.innerHTML;

  /*  NUEVO  ➜  restaura + re-engancha el botón "X"  */
  window.resetCarritoDialog = () => {
    dlgCarrito.innerHTML = plantillaCarrito;             // 1°  clona HTML

    // 2°  vuelve a conectar el botón "X" recién clonado
    dlgCarrito.querySelector('#dlg-carrito-cerrar')
              ?.addEventListener('click', () => {
        dlgCarrito.close();
        window.estadoFlujoCarrito = 'lista';
        renderCarrito();
    });
  };
});

/* ====== Contenido estático de las cajas ====== */
const BOX_VARIANTS_DATA = {
  1: {
    meta: {
      weight: '7.7 lb (3.5 kg)',
      dimensions: '8" × 8" × 8"',
      default: 'Mix',
      note: {
        es: 'La selección puede variar según la cosecha, manteniendo el mismo volumen y frescura premium.',
        en: 'Selections may vary with the harvest while keeping the same volume and premium quality.'
      }
    },
    Mix: {
      icon: '🥥',
      title: { es: 'Caribbean Fresh Pack · Mix', en: 'Caribbean Fresh Pack · Mix' },
      shortLabel: { es: 'Mix', en: 'Mix' },
      tagline: {
        es: 'Ideal para 1-2 personas que quieren desayunos tropicales, snacks y ensaladas frescas durante 3 días.',
        en: 'Ideal for 1-2 people who want tropical breakfasts, snacks and light salads for 3 days.'
      },
      focus: {
        es: 'Mix tropical para batidos y ensaladas rápidas.',
        en: 'Tropical mix for smoothies and quick salads.'
      },
      contents: {
        es: [
          '1 ajo, 2 cebollas, 1 ají',
          '2 papas/batatas, 1 brócoli chico, 2 tomates',
          '1 lechuga o repollo baby, 1 plátano, 2 chinolas',
          '1 mango, 1 piña, 3 limones',
          'Apio y hierbas sorpresa (perejil, cilantro, romero, orégano, canela)'
        ],
        en: [
          '1 garlic, 2 onions, 1 pepper',
          '2 potatoes/sweet potatoes, 1 small broccoli, 2 tomatoes',
          '1 baby lettuce or cabbage, 1 plantain, 2 passion fruits',
          '1 mango, 1 pineapple, 3 lemons',
          'Celery and surprise herbs (parsley, cilantro, rosemary, oregano, cinnamon)'
        ]
      },
      highlights: {
        es: [
          'Cosecha seleccionada el mismo día para asegurar frescura plena.',
          'Incluye hierbas frescas sorpresa para realzar tus platos.',
          'Pensada para que todo se consuma en 72 horas sin desperdicio.'
        ],
        en: [
          'Hand-picked the same day to ensure peak freshness.',
          'Includes surprise fresh herbs to elevate every dish.',
          'Portioned so everything can be enjoyed within 72 hours without waste.'
        ]
      }
    },
    Fruity: {
      icon: '🍓',
      title: { es: 'Caribbean Fresh Pack · Fruity', en: 'Caribbean Fresh Pack · Fruity' },
      shortLabel: { es: 'Frutal', en: 'Fruity' },
      tagline: {
        es: 'Caja 100% frutal para licuados, desayunos coloridos y meriendas refrescantes.',
        en: 'All-fruit box for smoothies, colourful breakfasts and refreshing snacks.'
      },
      focus: {
        es: 'Frutas tropicales listas para comer crudas o en batidos.',
        en: 'Ready-to-eat tropical fruit for bowls and smoothies.'
      },
      contents: {
        es: [
          '6 mandarinas dulces y 4 mangos de temporada',
          '2 piñas baby o piñas oro',
          '1 melón o lechosa mediana',
          '6 bananas + combo cítrico (limones y chinola)',
          'Menta fresca y fruta sorpresa de estación'
        ],
        en: [
          '6 sweet tangerines and 4 seasonal mangos',
          '2 baby pineapples or golden pineapples',
          '1 melon or medium papaya',
          '6 bananas + citrus combo (lemons and passion fruit)',
          'Fresh mint and a seasonal surprise fruit'
        ]
      },
      highlights: {
        es: [
          'Suficiente fruta para 10-12 porciones individuales.',
          'Perfecta para jugos detox y parfaits con yogur.',
          'Incluye hierbas aromáticas para aguas saborizadas.'
        ],
        en: [
          'Enough fruit for roughly 10-12 single servings.',
          'Perfect for detox juices and yogurt parfaits.',
          'Includes fresh herbs to infuse water and refreshments.'
        ]
      }
    },
    Veggie: {
      icon: '🥬',
      title: { es: 'Caribbean Fresh Pack · Veggie', en: 'Caribbean Fresh Pack · Veggie' },
      shortLabel: { es: 'Veggie', en: 'Veggie' },
      tagline: {
        es: 'Porción optimizada de verduras crujientes para guarniciones y salteados rápidos.',
        en: 'Optimised veggie portion for sides, sautés and hearty salads.'
      },
      focus: {
        es: 'Vegetales listos para meal prep de mediodía.',
        en: 'Veggies ready for midday meal prep.'
      },
      contents: {
        es: [
          '2 ajos y 4 cebollas medianas',
          '4 papas o batatas',
          '1 brócoli, 1 coliflor baby',
          '4 tomates, 1 pepino y 1 calabacín',
          'Lechuga romana + cilantro y perejil frescos'
        ],
        en: [
          '2 garlic bulbs and 4 medium onions',
          '4 potatoes or sweet potatoes',
          '1 broccoli, 1 baby cauliflower',
          '4 tomatoes, 1 cucumber and 1 zucchini',
          'Romaine lettuce plus fresh cilantro and parsley'
        ]
      },
      highlights: {
        es: [
          'Base ideal para sopas, cremas y salteados ligeros.',
          'Incluye verdes crujientes y hierbas para finalizar platos.',
          'Porciones equilibradas para meal prep sin desperdicio.'
        ],
        en: [
          'Ideal base for soups, purées and light stir-fries.',
          'Includes crisp greens and herbs to finish dishes.',
          'Balanced portions for meal prep with zero waste.'
        ]
      }
    }
  },
  2: {
    meta: {
      weight: '13.2 lb (6 kg)',
      dimensions: '11" × 10" × 16"',
      default: 'Mix',
      note: {
        es: 'Combinamos siempre frutas y hortalizas de temporada en proporciones equivalentes.',
        en: 'We always pair seasonal fruit and vegetables in equivalent proportions.'
      }
    },
    Mix: {
      icon: '🍍',
      title: { es: 'Island Weekssential · Mix', en: 'Island Weekssential · Mix' },
      shortLabel: { es: 'Mix', en: 'Mix' },
      tagline: {
        es: 'Surtido semanal para familias de 3-4 personas que quieren planificar desayunos, almuerzos y snacks.',
        en: 'Weekly assortment for 3-4 people planning breakfasts, lunches and snacks.'
      },
      focus: {
        es: 'Cobertura semanal para jugos, guarniciones y platos principales.',
        en: 'Weekly coverage for juices, sides and main dishes.'
      },
      contents: {
        es: [
          '1 ajo, 4 cebollas, 1 ají',
          '6 papas/batatas y 1 calabaza',
          '1 brócoli grande, 4 tomates, 1 lechuga y 1 repollo',
          '2 plátanos, 5 guineos verdes, 4 guineos maduros',
          'Fresas, 2 mangos, 1 piña, 1 lechosa, apio y 2 berenjenas'
        ],
        en: [
          '1 garlic, 4 onions, 1 pepper',
          '6 potatoes/sweet potatoes and 1 pumpkin',
          '1 large broccoli, 4 tomatoes, 1 lettuce and 1 cabbage',
          '2 plantains, 5 green bananas, 4 ripe bananas',
          'Strawberries, 2 mangos, 1 pineapple, 1 papaya, celery and 2 eggplants'
        ]
      },
      highlights: {
        es: [
          'Perfecta para meal prep de cinco días.',
          'Incluye fruta fresca para postres y licuados.',
          'Equilibrio entre carbohidratos, hojas y frutas tropicales.'
        ],
        en: [
          'Perfect for five-day meal prep.',
          'Includes fresh fruit for desserts and shakes.',
          'Balanced mix of carbs, greens and tropical fruit.'
        ]
      }
    },
    Fruity: {
      icon: '🍉',
      title: { es: 'Island Weekssential · Fruity', en: 'Island Weekssential · Fruity' },
      shortLabel: { es: 'Frutal', en: 'Fruity' },
      tagline: {
        es: 'Selección frutal abundante para desayunos familiares, aguas saborizadas y postres ligeros.',
        en: 'Generous fruit selection for family breakfasts, infused waters and light desserts.'
      },
      focus: {
        es: 'Frutas variadas para 7 días de snacks y batidos.',
        en: 'Varied fruit for 7 days of snacks and smoothies.'
      },
      contents: {
        es: [
          '12 guineos entre verdes y maduros',
          '6 mandarinas, 6 naranjas y 6 limones',
          '3 mangos, 2 piñas y 1 melón',
          '1 lechosa grande, fresas y uvas de estación',
          'Hierbas aromáticas (menta y albahaca) para infusiones'
        ],
        en: [
          '12 bananas (mix of green and ripe)',
          '6 tangerines, 6 oranges and 6 lemons',
          '3 mangos, 2 pineapples and 1 melon',
          '1 large papaya, strawberries and seasonal grapes',
          'Aromatic herbs (mint and basil) for infusions'
        ]
      },
      highlights: {
        es: [
          'Rinde para 15-18 porciones de fruta fresca.',
          'Ideal para jugos naturales y toppings de bowls.',
          'Cítricos suficientes para vinagretas y aguas infusionadas.'
        ],
        en: [
          'Yields 15-18 servings of fresh fruit.',
          'Ideal for natural juices and bowl toppings.',
          'Plenty of citrus for dressings and infused waters.'
        ]
      }
    },
    Veggie: {
      icon: '🥕',
      title: { es: 'Island Weekssential · Veggie', en: 'Island Weekssential · Veggie' },
      shortLabel: { es: 'Veggie', en: 'Veggie' },
      tagline: {
        es: 'Verduras para cocinar toda la semana: sopas, salteados y ensaladas contundentes.',
        en: 'Veggies to cook all week: soups, stir-fries and hearty salads.'
      },
      focus: {
        es: 'Preparaciones calientes y frías durante 7 días.',
        en: 'Hot and cold dishes for the entire week.'
      },
      contents: {
        es: [
          '4 cebollas, 2 ajíes y 2 cabezas de ajo',
          '8 papas/batatas y 1 yuca grande',
          '1 brócoli XL, 1 coliflor, 6 zanahorias',
          '2 lechugas (romana y rizada) + espinaca baby',
          'Apio, cilantro, perejil y hierbas aromáticas'
        ],
        en: [
          '4 onions, 2 peppers and 2 garlic bulbs',
          '8 potatoes/sweet potatoes plus 1 large cassava',
          '1 XL broccoli, 1 cauliflower, 6 carrots',
          '2 lettuces (romaine and curly) + baby spinach',
          'Celery, cilantro, parsley and aromatic herbs'
        ]
      },
      highlights: {
        es: [
          'Cobertura para guisos, cremas y ensaladas de la semana.',
          'Incluye hojas verdes, raíces y hierbas en proporción equilibrada.',
          'Perfecta para dividir en dos sesiones de meal prep.'
        ],
        en: [
          'Coverage for stews, soups and salads throughout the week.',
          'Balanced proportion of greens, roots and herbs.',
          'Perfect to split into two meal-prep sessions.'
        ]
      }
    }
  },
  3: {
    meta: {
      weight: '26.5 lb (12 kg)',
      dimensions: '16" × 16" × 16"',
      default: 'Mix',
      note: {
        es: 'Pensada para grandes familias o planes detox; puedes solicitar dividir la entrega en dos partes.',
        en: 'Designed for larger families or detox plans; you can request to split the delivery in two.'
      }
    },
    Mix: {
      icon: '🥑',
      title: { es: 'All Greenxclusive · Mix', en: 'All Greenxclusive · Mix' },
      shortLabel: { es: 'Mix', en: 'Mix' },
      tagline: {
        es: 'Nuestra caja insignia para 4-6 personas o entusiastas de jugos y bowls durante 14 días.',
        en: 'Our flagship box for 4-6 people or juice & bowl lovers for 14 days.'
      },
      focus: {
        es: 'Stock completo para jugos detox, meal prep y acompañamientos.',
        en: 'Full pantry restock for detox juices, meal prep and hearty sides.'
      },
      contents: {
        es: [
          '2 ajos, 6 cebollas, 2 ajíes',
          '8 papas/batatas y 1 yautía',
          '1 brócoli grande, 1 coliflor mediana, 8 tomates',
          '2 lechugas, 1 repollo entero, 2 pepinos',
          '2 plátanos grandes, 10 guineos verdes, 4 mangos, 2 piñas, 10 limones',
          '5 zanahorias, 4 berenjenas + hierbas premium'
        ],
        en: [
          '2 garlic bulbs, 6 onions, 2 peppers',
          '8 potatoes/sweet potatoes plus 1 malanga',
          '1 large broccoli, 1 medium cauliflower, 8 tomatoes',
          '2 lettuces, 1 whole cabbage, 2 cucumbers',
          '2 large plantains, 10 green bananas, 4 mangos, 2 pineapples, 10 lemons',
          '5 carrots, 4 eggplants + premium herbs'
        ]
      },
      highlights: {
        es: [
          'Rinde para 25-30 preparaciones entre jugos y platos fuertes.',
          'Incluye raíces, hojas y frutas en proporciones balanceadas.',
          'Puedes solicitar cortes previos o dividir la entrega.'
        ],
        en: [
          'Yields around 25-30 juices and hearty dishes.',
          'Balanced proportions of roots, greens and fruit.',
          'You may request pre-cut items or split delivery.'
        ]
      }
    },
    Fruity: {
      icon: '🍇',
      title: { es: 'All Greenxclusive · Fruity', en: 'All Greenxclusive · Fruity' },
      shortLabel: { es: 'Frutal', en: 'Fruity' },
      tagline: {
        es: 'Macro selección frutal para smoothies familiares, postres saludables y barras de jugos.',
        en: 'Macro fruit selection for family smoothies, healthy desserts and juice bars.'
      },
      focus: {
        es: 'Provisión de fruta para 2 semanas.',
        en: 'Two-week fruit supply.'
      },
      contents: {
        es: [
          '8 mangos mixtos (maduro + semi maduro)',
          '12 guineos, 6 plátanos maduros',
          '6 naranjas, 6 limones, 6 chinolas',
          '4 piñas, 2 melones, 2 lechosas XL',
          'Frutos rojos de temporada (fresas, uvas, arándanos)',
          'Hierbas frescas (menta, albahaca, limón) para aguas y mocktails'
        ],
        en: [
          '8 mixed mangos (ripe + semi-ripe)',
          '12 bananas, 6 ripe plantains',
          '6 oranges, 6 lemons, 6 passion fruits',
          '4 pineapples, 2 melons, 2 XL papayas',
          'Seasonal berries (strawberries, grapes, blueberries)',
          'Fresh herbs (mint, basil, lemon balm) for waters and mocktails'
        ]
      },
      highlights: {
        es: [
          'Diseñada para bares de jugos o familias grandes.',
          'Suficiente variedad para postres tropicales y mermeladas caseras.',
          'Incluye cítricos para curar ceviches y aderezos.'
        ],
        en: [
          'Designed for juice bars or large families.',
          'Enough variety for tropical desserts and homemade jams.',
          'Includes citrus perfect for ceviche and dressings.'
        ]
      }
    },
    Veggie: {
      icon: '🥦',
      title: { es: 'All Greenxclusive · Veggie', en: 'All Greenxclusive · Veggie' },
      shortLabel: { es: 'Veggie', en: 'Veggie' },
      tagline: {
        es: 'Todo lo necesario para menús vegetarianos o veganos abundantes durante dos semanas.',
        en: 'Everything you need for abundant vegetarian or vegan menus for two weeks.'
      },
      focus: {
        es: 'Meal prep avanzado, fermentos y batch cooking.',
        en: 'Advanced meal prep, ferments and batch cooking.'
      },
      contents: {
        es: [
          '10 papas/batatas, 6 zanahorias, 4 remolachas',
          '3 brócolis, 2 coliflores, 6 calabacines',
          '4 lechugas (romana, rizada, butter y kale)',
          '2 repollos, 6 pepinos, 6 tomates heirloom',
          'Set gourmet de hongos y hierbas premium (tomillo, romero, salvia)',
          'Raíces aromáticas: jengibre, cúrcuma y galanga'
        ],
        en: [
          '10 potatoes/sweet potatoes, 6 carrots, 4 beets',
          '3 broccolis, 2 cauliflowers, 6 zucchinis',
          '4 lettuces (romaine, curly, butter and kale)',
          '2 cabbages, 6 cucumbers, 6 heirloom tomatoes',
          'Gourmet mushroom and herb set (thyme, rosemary, sage)',
          'Aromatic roots: ginger, turmeric and galangal'
        ]
      },
      highlights: {
        es: [
          'Pensada para batch cooking, fermentos y dietas basadas en plantas.',
          'Incluye hongos y hierbas gourmet difíciles de conseguir.',
          'Suficiente para 35-40 raciones principales o guarniciones.'
        ],
        en: [
          'Built for batch cooking, ferments and plant-based diets.',
          'Includes gourmet mushrooms and hard-to-find herbs.',
          'Enough for 35-40 main servings or side dishes.'
        ]
      }
    }
  }
};

const BOX_VARIANT_DEFAULT = { 1: 'Mix', 2: 'Mix', 3: 'Mix' };
let modalCajaEstado = { boxId: null, variant: null };

function cambiarVarianteCaja(variant) {
  if (!modalCajaEstado.boxId) return;
  const box = BOX_VARIANTS_DATA[modalCajaEstado.boxId];
  if (!box || !box[variant]) return;
  modalCajaEstado.variant = variant;
  renderModalBoxContent();
}

function renderModalBoxContent() {
  const { boxId, variant } = modalCajaEstado;
  const modalText = document.getElementById('modal-box-text');
  if (!modalText || !boxId) return;
  const box = BOX_VARIANTS_DATA[boxId];
  if (!box) return;
  const info = box[variant];
  if (!info) return;

  const lang = document.documentElement.lang || 'es';
  const meta = box.meta || {};
  const variantsKeys = Object.keys(box).filter(key => key !== 'meta');
  const selectorHtml = `
    <div class="modal-variant-selector">
      ${variantsKeys.map(key => {
        const data = box[key];
        const activeClass = key === variant ? 'active' : '';
        const label = data.shortLabel ? data.shortLabel[lang] : key;
        return `<button type="button" class="modal-variant-btn ${activeClass}" onclick="cambiarVarianteCaja('${key}')">${data.icon ? data.icon + ' ' : ''} ${label}</button>`;
      }).join('')}
    </div>`;
  
  const weightLabel = lang === 'en' ? 'Approx. weight' : 'Peso aprox.';
  const dimensionsLabel = lang === 'en' ? 'Dimensions' : 'Dimensiones';
  const focusLabel = lang === 'en' ? 'Focus' : 'Enfoque';
  const contentsLabel = lang === 'en' ? 'Reference contents' : 'Contenido referencia';
  const highlightsLabel = lang === 'en' ? 'Highlights' : 'Lo que obtienes';
  
  // Parsear contenidos para crear tabla: separar cantidad y producto
  const parseContentsToTable = (contents, currentLang) => {
    if (!contents || !Array.isArray(contents)) return '';
    
    const productLabel = currentLang === 'en' ? 'Product' : 'Producto';
    const quantityLabel = currentLang === 'en' ? 'Approx. quantity' : 'Cantidad aprox.';
    
    const rows = [];
    contents.forEach(item => {
      // Separar por comas para obtener cada producto
      const products = item.split(',').map(p => p.trim());
      products.forEach(product => {
        // Extraer cantidad (número al inicio) y producto
        const match = product.match(/^(\d+)\s+(.+)$/);
        if (match) {
          const [, quantity, productName] = match;
          rows.push({ quantity, product: productName });
        } else {
          // Si no hay número, es solo el producto
          rows.push({ quantity: '-', product: product });
        }
      });
    });
    
    if (rows.length === 0) return '';
    
    return `
      <table class="modal-box-contents-table">
        <thead>
          <tr>
            <th>${productLabel}</th>
            <th>${quantityLabel}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td>${row.product}</td>
              <td>${row.quantity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };
  
  const contentsHtml = parseContentsToTable(info.contents?.[lang] || [], lang);
  const highlightsHtml = (info.highlights?.[lang] || []).map(item => `<li>${item}</li>`).join('');
  const note = meta.note ? (meta.note[lang] || meta.note.es || meta.note.en) : (lang === 'en'
    ? 'Selections may vary with the harvest while keeping the same premium quality.'
    : 'La selección puede variar según la cosecha, manteniendo el mismo volumen y frescura premium.');
  
  modalText.innerHTML = `
    <div class="modal-box-content">
      ${selectorHtml}
      <span class="modal-box-pill">${info.icon ? info.icon + ' ' : ''} ${info.title?.[lang] || ''}</span>
      <p class="modal-box-sub">${info.tagline?.[lang] || ''}</p>
      <table class="modal-box-info-table">
        <tbody>
          <tr>
            <th>${weightLabel}</th>
            <td>${meta.weight || info.weight || ''}</td>
          </tr>
          <tr>
            <th>${dimensionsLabel}</th>
            <td>${meta.dimensions || info.dimensions || ''}</td>
          </tr>
          <tr>
            <th>${focusLabel}</th>
            <td>${info.focus?.[lang] || ''}</td>
          </tr>
        </tbody>
      </table>
      <div class="modal-box-section">
        <h4>${contentsLabel}</h4>
        ${contentsHtml}
      </div>
      <div class="modal-box-section">
        <h4>${highlightsLabel}</h4>
        <ul class="modal-box-list">
          ${highlightsHtml}
        </ul>
      </div>
      <p class="modal-box-note">${note}</p>
    </div>
  `;
}


/* ====== Funcionalidad del modal de cajas ====== */
function mostrarContenidoCaja(boxId) {
  const modal = document.getElementById('modal-box-content');
  const modalText = document.getElementById('modal-box-text');
  if (!modal || !modalText) return;
  const box = BOX_VARIANTS_DATA[boxId];
  if (!box) return;
  const selected = estadoCajas[boxId]?.variedad;
  const defaultVariant = selected && box[selected] ? selected : (box.meta?.default || Object.keys(box).find(key => key !== 'meta'));
  modalCajaEstado = { boxId, variant: defaultVariant };
  renderModalBoxContent();
  modal.showModal();
}

// Extrae el número del texto de precio, manejando comas
function parsePrecio(txt){
  const m = (txt||'').match(/\d+(?:,\d+)?/);
  return m ? parseFloat(m[0].replace(',', '')) : 0;
}

// Función anulada para evitar dependencias de audio inexistentes
function playWaterDrop() {}

// Función para manejar el modal de imágenes
function setupImagenModal() {
  const modal = document.getElementById('modal-imagen');
  const imagenModal = document.getElementById('imagen-modal');
  
  // Cerrar modal al hacer clic
  modal.addEventListener('click', () => {
    modal.classList.remove('activo');
  });

  // Agregar evento click a todas las imágenes de productos
  document.querySelectorAll('.paso-card img').forEach(img => {
    // Excluir imágenes del carrusel y de la sección de configuración
    if (!img.closest('.cinta-carrusel') && !img.closest('#config-productos')) {
      img.style.cursor = 'pointer';
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        imagenModal.src = img.src;
        modal.classList.add('activo');
      });
    }
  });
}

/* ----------  CARRITO  ---------- */
function renderCarrito() {
  const cont = document.getElementById('carrito-contenido');
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito)) carrito = [];
  if (!cont) return;
  let html = '';
  let total = 0;
  const lang = document.documentElement.lang || 'es';

  if (carrito.length === 0) {
    html = `
      <div class="text-center text-gray-500 my-8">
        <span class="lang-es" style="display:${lang === 'es' ? '' : 'none'};">El carrito está vacío</span>
        <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">The cart is empty</span>
      </div>
    `;
    cont.innerHTML = html;
    return;
  }

  carrito.forEach((item, index) => {
    const subtotal = item.precio * (item.cantidad || 1);
    total += subtotal;
    html += `
      <div class="bg-white rounded-lg shadow p-4 flex flex-col gap-2 mb-4">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-bold text-green-800 text-lg">${item.nombre}</div>
            ${item.variedad ? `<div class="text-sm text-gray-600">
              <span class="lang-es" style="display:${lang === 'es' ? '' : 'none'};">Variedad:</span>
              <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Variety:</span>
              ${item.variedad}
            </div>` : ''}
            ${item.preferencias ? `
              <div class="ml-2 text-sm bg-green-50 rounded-lg p-2">
                <div>
                  <b>👍</b> 
                  <span class="lang-es" style="display:${lang === 'es' ? '' : 'none'};">Me gusta:</span>
                  <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Likes:</span>
                  ${item.preferencias.like.map(n => {
                    const en = PRODUCTOS_TRADUCCIONES[n] || n;
                    return lang === 'es' ? n : en;
                  }).join(', ') || '-'}
                </div>
                <div>
                  <b>👎</b> 
                  <span class="lang-es" style="display:${lang === 'es' ? '' : 'none'};">No me gusta:</span>
                  <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Dislikes:</span>
                  ${item.preferencias.dislike.map(n => {
                    const en = PRODUCTOS_TRADUCCIONES[n] || n;
                    return lang === 'es' ? n : en;
                  }).join(', ') || '-'}
                </div>
              </div>` : ''}
          </div>
          <div class="text-right">
            <div class="flex items-center gap-2">
              <button onclick="cambiarCantidad(${index}, -1)"
                      class="w-7 h-7 bg-red-500 text-white rounded-full text-lg leading-none flex items-center justify-center">−</button>
              <span class="min-w-[32px] text-center font-semibold">${item.cantidad || 1}</span>
              <button onclick="cambiarCantidad(${index},  1)"
                      class="w-7 h-7 bg-green-600 text-white rounded-full text-lg leading-none flex items-center justify-center">+</button>
            </div>
            <p class="text-sm font-semibold text-green-800">DOP ${subtotal.toFixed(2)}</p>
            <button onclick="eliminarDelCarrito(${index})"
                    class="mt-2 text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span class="lang-es" style="display:${lang === 'es' ? '' : 'none'};">Eliminar</span>
              <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Remove</span>
            </button>
          </div>
        </div>
      </div>`;
  });

  // Agregar el total y el botón de continuar
  html += `
    <div class="mt-6 p-6 bg-green-50 rounded-lg">
      <div class="flex justify-between items-center mb-6">
        <span class="text-xl font-bold text-green-800">
          <span class="lang-es" style="display:${lang === 'es' ? '' : 'none'};">Total:</span>
          <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Total:</span>
        </span>
        <span class="text-xl font-bold text-green-800">DOP ${total.toFixed(2)}</span>
      </div>
      <button id="btn-continuar-pedido" 
              class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold">
        <span class="lang-es" style="display:${lang === 'es' ? '' : 'none'};">Continuar con el pedido</span>
        <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Continue with order</span>
      </button>
    </div>`;

  cont.innerHTML = html;

  // Actualizar el contador del icono del carrito
  const headerCount = document.getElementById('carrito-cantidad-header');
  if (headerCount) {
    const cantidad = carrito.reduce((total, item) => total + (item.cantidad || 1), 0);
    headerCount.textContent = cantidad;
    headerCount.style.opacity = cantidad > 0 ? '1' : '0';
  }
  // Listener para el botón de continuar
  document.getElementById('btn-continuar-pedido')?.addEventListener('click', handleContinuarPedido);
}

// Función para eliminar un producto del carrito
function eliminarDelCarrito(index) {
  playWaterDrop();
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito)) return;
  
  carrito.splice(index, 1);
  localStorage.setItem('carrito', JSON.stringify(carrito));
  renderCarrito();
  mostrarNotificacion('Producto eliminado del carrito');
  guardarCarritoEnFirebase();
}

function cambiarCantidad(index, delta) {
  playWaterDrop();
  let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito) || !carrito[index]) return;

  carrito[index].cantidad = (carrito[index].cantidad || 1) + delta;
  if (carrito[index].cantidad < 1) carrito[index].cantidad = 1; // nunca < 1
  localStorage.setItem('carrito', JSON.stringify(carrito));
  renderCarrito();
  guardarCarritoEnFirebase();
}

/* ----------  CONFIGURAR CAJA ---------- */
function abrirConfig(boxRef) {
  const rawId = typeof boxRef === 'string' ? boxRef : boxRef?.dataset?.box;
  const boxId = normalizarBoxId(rawId);
  if (!boxId) {
    console.warn('abrirConfig: boxId inválido', boxRef);
    return;
  }

  cajaActual = boxId;
  if (!estadoCajas[boxId]) {
    estadoCajas[boxId] = { variedad: null, like: [], dislike: [], ok: false };
  }

  preferenciasCaja.like = [...(estadoCajas[boxId]?.like || [])];
  preferenciasCaja.dislike = [...(estadoCajas[boxId]?.dislike || [])];

  clonarProductosSiHaceFalta();
  setLanguage(localStorage.getItem('lang') || 'es');
  
  const configSection = document.getElementById('configurar-caja');
  configSection.classList.remove('hidden');
  requestAnimationFrame(() =>
    configSection.scrollIntoView({ behavior: 'smooth' })
  );
  
  refrescarPreferenciasUI();

  const btnSave = document.getElementById('btn-guardar-preferencias');
  if (btnSave) {
    btnSave.classList.remove('hidden');
    btnSave.style.display = '';
    btnSave.disabled = true; // Se activa al marcar una preferencia
  }

  // Oculta la lista de resumen hasta que el usuario marque algo
  document.getElementById('lista-preferencias')?.classList.add('hidden');

  // Resalta las selecciones previas para esta caja
  document.querySelectorAll('#configurar-caja .producto-hover').forEach(card => {
    const n = card.dataset.nombre;
    card.classList.remove('ring-4', 'ring-green-400', 'ring-red-400');
    if (estadoCajas[boxId]?.like.includes(n)) card.classList.add('ring-4', 'ring-green-400');
    else if (estadoCajas[boxId]?.dislike.includes(n)) card.classList.add('ring-4', 'ring-red-400');
  });
}

// Definir traducciones de productos
const PRODUCTOS_TRADUCCIONES = {
  'Banana': 'Banana',
  'Piña': 'Pineapple',
  'Fresas': 'Strawberries',
  'Lechosa': 'Papaya',
  'Cerezas': 'Cherries',
  'Manzanas': 'Apples',
  'Sandía': 'Watermelon',
  'Melón': 'Melon',
  'Melón Francés': 'French Melon',
  'Pitahaya': 'Dragon Fruit',
  'Naranjas': 'Oranges',
  'Carambola': 'Star Fruit',
  'Cilantro': 'Cilantro',
  'Genjibre': 'Ginger',
  'Orégano': 'Oregano',
  'Perejil': 'Parsley',
  'Romero': 'Rosemary',
  'Cebollín': 'Chives',
  'Calabaza': 'Pumpkin',
  'Pepino': 'Cucumber',
  'Guineo verde': 'Green Banana',
  'Yuca': 'Cassava',
  'Repollo blanco': 'White Cabbage',
  'Coliflor': 'Cauliflower',
  'Brocoli': 'Broccoli',
  'Cebolla amarilla': 'Yellow Onion',
  'Zanahoria': 'Carrot',
  'Batata': 'Sweet Potato',
  'Aji morrones': 'Bell Pepper',
  'Maíz': 'Corn',
  'Limón': 'Lemon',
  'Cebolla morada': 'Red Onion',
  'Ajo': 'Garlic',
  'Uvas moradas': 'Purple Grapes'
};

function clonarProductosSiHaceFalta() {
  const gridFrutas = document.getElementById('config-productos-frutas');
  const gridVegetales = document.getElementById('config-productos-vegetales');
  const gridHierbas = document.getElementById('config-productos-hierbas');
  
  if (gridFrutas.dataset.ready) return;

  // Definir categorías
  const frutas = [
    // Frutas tropicales
    'Banana', 'Piña', 'Mango', 'Lechosa', 'Pitahaya', 'Carambola',
    // Frutas cítricas
    'Naranjas', 'Limón', 'Mandarinas',
    // Frutas de temporada
    'Fresas', 'Cerezas', 'Manzanas', 'Sandía', 'Melón', 'Melón Francés',
    // Frutas secas
    'Uvas blancas', 'Uvas moradas',
    // Otras frutas
    'Coco', 'Aguacates'
  ];

  const vegetales = [
    // Tubérculos y raíces
    'Yuca', 'Ñame', 'Batata',
    // Verduras de hoja
    'Repollo blanco', 'Lechuga',
    // Verduras crucíferas
    'Coliflor', 'Brocoli',
    // Verduras de bulbo
    'Cebolla amarilla', 'Cebolla morada', 'Ajo',
    // Verduras de fruto
    'Tomate bugalú', 'Tomate redondo', 'Pepino', 'Calabaza', 'Maíz',
    // Legumbres
    'Lentejas', 'Habichuelas rojas', 'Habichuelas negras',
    // Granos
    'Quinoa', 'Arroz blanco', 'Arroz integral'
  ];

  const hierbas = [
    // Hierbas aromáticas
    'Cilantro', 'Perejil', 'Romero', 'Orégano',
    // Hierbas medicinales
    'Genjibre',
    // Hierbas de cocina
    'Cebollín'
  ];

  document.querySelectorAll('#alacarta .producto-hover').forEach(card => {
    const clon = card.cloneNode(true);
    const nombre = clon.querySelector('.font-bold').textContent.trim();
    clon.dataset.nombre = nombre;
    
    // Remover todos los precios y el botón de agregar
    clon.querySelectorAll('.text-green-800').forEach(e => e.remove());
    const btnAgregar = clon.querySelector('.agregar-carrito');
    if (btnAgregar) btnAgregar.remove();

    // Agregar botones de like/dislike
    const like = Object.assign(document.createElement('button'), { 
      textContent: '👍', 
      className: 'like-btn text-2xl px-3 py-1 bg-green-600 text-white rounded-full shadow-lg hover:scale-110 transition' 
    });
    const dislike = Object.assign(document.createElement('button'), { 
      textContent: '👎', 
      className: 'dislike-btn text-2xl px-3 py-1 bg-red-600 text-white rounded-full shadow-lg hover:scale-110 transition' 
    });

    like.onclick = () => marcar(clon, true);
    dislike.onclick = () => marcar(clon, false);

    const contBtn = Object.assign(document.createElement('div'), { className: 'flex gap-2 justify-center mt-2' });
    contBtn.append(like, dislike);
    clon.appendChild(contBtn);

    // Agregar traducciones
    const titulo = clon.querySelector('.font-bold');
    const nombreEn = PRODUCTOS_TRADUCCIONES[nombre] || nombre;
    
    // Crear elementos span para cada idioma
    const spanEs = document.createElement('span');
    spanEs.className = 'lang-es';
    spanEs.textContent = nombre;
    
    const spanEn = document.createElement('span');
    spanEn.className = 'lang-en';
    spanEn.textContent = nombreEn;
    
    // Reemplazar el contenido del título
    titulo.innerHTML = '';
    titulo.appendChild(spanEs);
    titulo.appendChild(spanEn);

    // Distribuir en la categoría correspondiente
    if (frutas.includes(nombre)) {
      gridFrutas.appendChild(clon);
    } else if (hierbas.includes(nombre)) {
      gridHierbas.appendChild(clon);
    } else {
      gridVegetales.appendChild(clon);
    }
  });

  gridFrutas.dataset.ready = '1';
  gridVegetales.dataset.ready = '1';
  gridHierbas.dataset.ready = '1';
}

function marcar(card, esLike) {
  playWaterDrop();
  const n = card.dataset.nombre;
  preferenciasCaja.like    = preferenciasCaja.like.filter(x => x !== n);
  preferenciasCaja.dislike = preferenciasCaja.dislike.filter(x => x !== n);
  (esLike ? preferenciasCaja.like : preferenciasCaja.dislike).push(n);

  card.classList.remove('seleccion-like', 'seleccion-dislike');
  card.classList.add(esLike ? 'seleccion-like' : 'seleccion-dislike');

  if (cajaActual) {
    estadoCajas[cajaActual].like    = [...preferenciasCaja.like];
    estadoCajas[cajaActual].dislike = [...preferenciasCaja.dislike];
  }
  refrescarPreferenciasUI();
  document.getElementById('btn-guardar-preferencias').disabled = false;
}

function refrescarPreferenciasUI() {
  const ul = document.getElementById('lista-preferencias');
  ul.innerHTML = '';
  preferenciasCaja.like.forEach   (n => ul.innerHTML += `<li>👍 ${n}</li>`);
  preferenciasCaja.dislike.forEach(n => ul.innerHTML += `<li>👎 ${n}</li>`);
}

/* ----------  AGREGAR AL CARRITO ---------- */
function agregarAlCarritoDesdeTarjeta(btn) {
  playWaterDrop();
  const card = btn.closest('.paso-card');
  if (!card) return;

  // Esta función ahora solo maneja productos simples, no cajas.
  const nombre = card.querySelector('.font-bold')?.textContent.trim() || 'Producto';
  const precioText = card.querySelector('.text-green-800')?.textContent;
  const precio = parsePrecio(precioText);

  const item = {
    tipo: 'producto',
    nombre: nombre,
    precio: isNaN(precio) ? 0 : precio,
    cantidad: 1
  };
  
  agregarAlCarrito(item);
}

/* ----------  INICIALIZACIÓN ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('lang');
  const currentLang = savedLang || document.documentElement.lang || 'es';
  document.getElementById('btn-guardar-preferencias')
          ?.addEventListener('click', guardarPreferencias);

  /* --- NUEVO: cierra el popup de resumen --- */
  document.getElementById('dlg-resumen-cerrar')
          ?.addEventListener('click', () => {
            playWaterDrop();
            /* 1) Cierra el pop-up */
            document.getElementById('dlg-resumen').close();

            /* 2) Oculta la sección de configuración */
            document.getElementById('configurar-caja')
                    .classList.add('hidden');

            /* 3) Sube con scroll a la zona de cajas */
            document.querySelector('#cajas')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });

  document.getElementById('carrito-header-btn')
          ?.addEventListener('click', () => {
            playWaterDrop();
            resetCarritoDialog();
            window.estadoFlujoCarrito = "lista";
            renderCarrito();
            document.getElementById('dlg-carrito').showModal();
          });
          
  document.getElementById('dlg-carrito-cerrar')
          ?.addEventListener('click', () => {
            playWaterDrop();
            document.getElementById('dlg-carrito').close();
            window.estadoFlujoCarrito = "lista"; // Resetear flujo al cerrar
          });

  /* Delegación global para todos los botones "Agregar" */
  document.addEventListener('click', ev => {
    const btn = ev.target.closest('.agregar-carrito');
    if (btn) agregarAlCarritoDesdeTarjeta(btn);
  });

  // Agregar el sonido a todos los botones de variedad
  document.querySelectorAll('.variedad-btn').forEach(btn => {
    btn.addEventListener('click', playWaterDrop);
  });

  // Agregar el sonido a los botones de like/dislike
  document.querySelectorAll('.like-btn, .dislike-btn').forEach(btn => {
    btn.addEventListener('click', playWaterDrop);
  });

  // Agregar el sonido al botón de guardar preferencias
  document.getElementById('btn-guardar-preferencias')?.addEventListener('click', playWaterDrop);

  // Agregar el sonido a los botones de idioma
  document.getElementById('btn-es')?.addEventListener('click', playWaterDrop);
  document.getElementById('btn-en')?.addEventListener('click', playWaterDrop);
  document.getElementById('btn-es')?.addEventListener('click', () => setLanguage('es'));
  document.getElementById('btn-en')?.addEventListener('click', () => setLanguage('en'));

  // Agregar el sonido al botón del menú
  document.getElementById('menu-toggle')?.addEventListener('click', playWaterDrop);
  document.getElementById('menu-toggle')?.addEventListener('click', toggleMobileMenu);

  // Agregar el sonido a los botones de configuración
  document.getElementById('btn-config-si')?.addEventListener('click', playWaterDrop);
  document.getElementById('btn-config-no')?.addEventListener('click', playWaterDrop);

  // Agregar el sonido a los botones de configuración de caja
  document.querySelectorAll('.config-caja-btn').forEach(btn => {
    btn.addEventListener('click', playWaterDrop);
    btn.addEventListener('click', () => abrirConfig(btn.dataset.box));
    actualizarBotonConfig(btn.dataset.box);
  });

  // Configurar el modal de imágenes
  setupImagenModal();

  /* ========= Infografía de Cajas (dialog API) ========= */
  const btnInfografia = document.getElementById('btn-infografia-cajas');
  const dlgInfografia = document.getElementById('dlg-infografia-cajas');

  if (btnInfografia && dlgInfografia) {
    btnInfografia.addEventListener('click', () => {
      const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
      const imgInfografia = dlgInfografia.querySelector('.infografia-img');
      if (imgInfografia) {
        imgInfografia.src =
          lang === 'en'
            ? 'assets/images/banners/InfografiaCajasENG.jpg'
            : 'assets/images/banners/InfografiaCajasESP.jpg';
      }
      dlgInfografia.showModal();
    });

    // Cerrar al hacer clic fuera o con el botón OK
    dlgInfografia.addEventListener('click', (e) => {
      if (e.target === dlgInfografia) dlgInfografia.close();
    });
  }
  /* ========= Fin Infografía de Cajas ========= */

  /* Footer actions */
  const btnBack = document.getElementById('btn-back');
  const btnCart = document.getElementById('btn-cart');
  const btnHome = document.getElementById('btn-home');
  const btnWhatsApp = document.getElementById('btn-whatsapp-footer');
  
  if (btnBack) {
    btnBack.onclick = () => {
      playWaterDrop();
      history.back();
    };
  }
  
  if (btnCart) {
    btnCart.onclick = () => {
      playWaterDrop();
      resetCarritoDialog();
      window.estadoFlujoCarrito = "lista";
      renderCarrito();
      document.getElementById('dlg-carrito').showModal();
    };
  }
  
  if (btnHome) {
    btnHome.onclick = () => {
      playWaterDrop();
      document.getElementById('inicio').scrollIntoView({behavior:'smooth'});
    };
  }
  
  if (btnWhatsApp) {
    const updateWhatsAppLink = () => {
      const lang = document.documentElement.lang || 'es';
      const mensaje = lang === 'en' 
        ? 'Hello GreenDolio! I would like to place an order.'
        : 'Hola GreenDolio! Me gustaría hacer un pedido.';
      btnWhatsApp.href = `https://wa.me/18097537338?text=${encodeURIComponent(mensaje)}`;
    };
    
    updateWhatsAppLink();
    // Actualizar el link cuando cambie el idioma
    document.addEventListener('languageChanged', updateWhatsAppLink);
  }

  /* Reubicar botón Guardar cuando está visible */
  const guardar = document.getElementById('btn-guardar-preferencias');
  const ajustePos = () => {
    const visible = !document.getElementById('configurar-caja').classList.contains('hidden');
    guardar.style.bottom = visible ? '96px' : '32px'; // = zócalo 64px + margen
  };
  ['click','scroll'].forEach(ev=>document.addEventListener(ev,ajustePos));
  ajustePos();

  /* Evento de tecla Escape para cerrar el modal de cajas */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal-box-content');
      if (modal && modal.open) {
        modal.close();
      }
    }
  });

  actualizarTarjetasProductos();
  setLanguage(currentLang);

  inicializarCarrito();

  const modalResumen = document.getElementById('modal-resumen');
  document.getElementById('cerrar-modal-resumen')
          ?.addEventListener('click', cerrarModalResumen);
  document.getElementById('enviar-whatsapp')
          ?.addEventListener('click', enviarPedidoWhatsApp);
  modalResumen?.addEventListener('click', (event) => {
    if (event.target === modalResumen) {
      cerrarModalResumen();
    }
  });
});

/* ----------  RESETEAR OTRAS CAJAS (al cambiar de variedad) ---------- */
function resetearCajasExcepto(boxIdKeep) {
  const mantener = normalizarBoxId(boxIdKeep);
  Object.keys(estadoCajas).forEach(boxId => {
    if (boxId !== mantener) {
      estadoCajas[boxId] = { variedad: null, like: [], dislike: [], ok: false };
      actualizarBotonAgregar(boxId);
      actualizarBotonConfig(boxId);
    }
  });

  /* 4‒ Quita marcas visuales de productos */
  document.querySelectorAll('#configurar-caja .producto-hover')
          .forEach(card => {
            card.classList.remove(
              'seleccion-like','seleccion-dislike',
              'ring-4','ring-green-400','ring-red-400'
            );
          });
}

/* ----------  SELECCIONAR VARIEDAD ---------- */
function seleccionarVariedad(btn) {
  const card  = btn.closest('.caja-hover');
  if (!card) return;
  const boxId = normalizarBoxId(card.dataset.box || btn.dataset.box);
  if (!boxId) return;

  resetearCajasExcepto(boxId);

  // crea estado si no existe
  if (!estadoCajas[boxId])
      estadoCajas[boxId] = { variedad:null, like:[], dislike:[], ok:false };

  // guarda la variedad elegida
  estadoCajas[boxId].variedad = btn.dataset.variedad;

  /* Actualiza el estilo de todos los botones de esa tarjeta */
  card.querySelectorAll('.variedad-btn').forEach(b => {
    b.classList.remove('selected', 'bg-green-600', 'text-white');
    b.classList.add   ('bg-green-100', 'text-green-800');
  });
  btn.classList.remove('bg-green-100', 'text-green-800');
  btn.classList.add   ('selected', 'bg-green-600', 'text-white');

  actualizarBotonConfig(boxId);
  // habilita "Agregar" si ya se guardaron las preferencias
  actualizarBotonAgregar(boxId);
}

/* Habilita/Deshabilita el botón Agregar de cada caja */
function actualizarBotonAgregar(boxId) {
  const normalized = normalizarBoxId(boxId);
  if (!normalized) return;
  const card = document.querySelector(`.caja-hover[data-box="${normalized}"]`);
  if (!card) return;
  const btn = card.querySelector('.agregar-carrito');
  const estado = estadoCajas[normalized];
  const ok  = estado?.variedad && estado.ok;
  if (btn) {
    btn.disabled = !ok;
    btn.classList.toggle('opacity-50', !ok);
    btn.classList.toggle('cursor-not-allowed', !ok);
  }
}

function actualizarBotonConfig(boxId) {
  const normalized = normalizarBoxId(boxId);
  if (!normalized) return;
  const btn = document.querySelector(`.config-caja-btn[data-box="${normalized}"]`);
  if (!btn) return;
  const habilitado = !!estadoCajas[normalized]?.variedad;
  btn.disabled = !habilitado;
  btn.classList.toggle('opacity-50', !habilitado);
  btn.classList.toggle('cursor-not-allowed', !habilitado);
  btn.classList.toggle('hover:bg-yellow-500', habilitado);
  actualizarTooltipConfigBtn(btn);
}

function obtenerIdiomaActual() {
  return document.documentElement.lang || localStorage.getItem('lang') || 'es';
}

function actualizarTooltipConfigBtn(btn) {
  if (!btn) return;
  const lang = obtenerIdiomaActual();
  const mensaje = lang === 'en' ? (btn.dataset.tooltipEn || '') : (btn.dataset.tooltipEs || '');
  if (btn.disabled && mensaje) {
    btn.setAttribute('data-tooltip', mensaje);
  } else {
    btn.removeAttribute('data-tooltip');
  }
}

/* --- NUEVA versión robusta --- */
function guardarPreferencias() {
  playWaterDrop();
  const boxId = normalizarBoxId(cajaActual);
  if (!boxId || !estadoCajas[boxId]) {
    alert('Error: No se ha seleccionado ninguna caja.');
    return;
  }

  // 1. Guarda las preferencias en el estado de la caja
  estadoCajas[boxId].like = [...preferenciasCaja.like];
  estadoCajas[boxId].dislike = [...preferenciasCaja.dislike];
  estadoCajas[boxId].ok = true;

  // 2. Obtiene los datos de la tarjeta HTML para crear el item del carrito
  let card = document.querySelector(`.caja-hover[data-box="${boxId}"]`);
  // Si no se encuentra, intenta con diferentes formatos
  if (!card) {
    const numeroCaja = obtenerNumeroCaja(boxId);
    card = document.querySelector(`.caja-hover[data-box="box${numeroCaja}"]`) ||
           document.querySelector(`.caja-hover[data-box="${numeroCaja}"]`) ||
           document.querySelector(`.caja-hover[data-box="box-${numeroCaja}"]`);
  }
  if (!card) {
    console.error('No se encontró la tarjeta de la caja para:', boxId);
    alert('Error: No se encontró la tarjeta de la caja. Por favor, recarga la página.');
    return;
  }
  const numeroCaja = obtenerNumeroCaja(boxId);
  const nombre = card.querySelector('.text-3xl, .text-4xl')?.textContent.trim() || `Caja ${numeroCaja || boxId}`;
  const precio = parsePrecio(card.querySelector('.inline-block.bg-white')?.textContent);
  const estado = estadoCajas[boxId];

  const item = {
    tipo: 'caja',
    nombre: nombre,
    precio: isNaN(precio) ? 0 : precio,
    variedad: estado.variedad,
    preferencias: { like: [...estado.like], dislike: [...estado.dislike] },
    cantidad: 1
  };
  
  // 3. Llama a la lógica para agregar al carrito
  agregarAlCarrito(item);

  // 4. Oculta la sección de configuración y vuelve a la sección de cajas
  document.getElementById('configurar-caja').classList.add('hidden');
  document.querySelector('#cajas')?.scrollIntoView({ behavior: 'smooth' });
}

/* ----------  NOTIFICACIONES ---------- */
function mostrarNotificacion(mensaje) {
  // Crear el elemento de notificación si no existe
  let notificacion = document.getElementById('notificacion');
  if (!notificacion) {
    notificacion = document.createElement('div');
    notificacion.id = 'notificacion';
    notificacion.style.cssText = `
      position: fixed;
      top: 30px;
      left: 50%;
      transform: translateX(-50%);
      max-width: min(90vw, 420px);
      padding: 15px 25px;
      background-color: #4CAF50;
      text-align: center;
      color: white;
      border-radius: 999px;
      box-shadow: 0 10px 30px rgba(15, 118, 110, 0.3);
      z-index: 2147483500;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
    `;
    document.body.appendChild(notificacion);
  }

  // Mostrar el mensaje
  notificacion.textContent = mensaje;
  notificacion.style.opacity = '1';
  notificacion.style.transform = 'translateX(-50%) translateY(0)';

  // Ocultar después de 3 segundos
  setTimeout(() => {
    notificacion.style.opacity = '0';
    notificacion.style.transform = 'translateX(-50%) translateY(-10px)';
  }, 3000);
}

// Función para mostrar el formulario de pedido
function mostrarFormularioPedido() {
  if (window.estadoFlujoCarrito !== 'formulario') {
    window.estadoFlujoCarrito = 'lista';
    renderCarrito();
    return;
  }
  if (typeof firebase !== 'undefined' && !firebase.auth().currentUser) {
    return;
  }

  const user = typeof firebase !== 'undefined' ? firebase.auth().currentUser : null;
  const profile = window.userProfile || {};
  const nombreDefault = profile.displayName || user?.displayName || '';
  const telefonoDefault = profile.telefono || '';
  const direccionDefault = profile.direccion || '';
  const pagoDefault = profile.pagoPreferido || '';
  const lang = obtenerIdiomaActual();
  const notasPreferencias = [];
  if (profile.likes) {
    notasPreferencias.push(lang === 'en' ? `Likes: ${profile.likes}` : `Gustos: ${profile.likes}`);
  }
  if (profile.dislikes) {
    notasPreferencias.push(lang === 'en' ? `Avoid: ${profile.dislikes}` : `Evitar: ${profile.dislikes}`);
  }
  const observacionesDefault = notasPreferencias.join('\n');

  const dialog = document.getElementById('dlg-carrito');
  dialog.innerHTML = /* html */`
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-green-800">
              <span class="lang-es" style="display:${lang === 'es' ? '' : 'none'};">Completar pedido</span>
              <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Complete order</span>
            </h2>
            <button onclick="this.closest('dialog').close()" class="text-gray-500 hover:text-gray-700">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form id="form-pedido" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="lang-es">Nombre</span>
                <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Name</span>
              </label>
              <input type="text" name="nombre" required
                     placeholder="${lang === 'en' ? 'Your name' : 'Tu nombre'}"
                     value="${escaparAttr(nombreDefault)}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="lang-es">Teléfono</span>
                <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Phone</span>
              </label>
              <input type="tel" name="telefono" required
                     placeholder="${lang === 'en' ? 'Your phone number' : 'Tu número de teléfono'}"
                     value="${escaparAttr(telefonoDefault)}"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="lang-es">Día de entrega</span>
                <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Delivery day</span>
              </label>
              <select name="dia" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">${lang === 'en' ? 'Select day' : 'Seleccionar día'}</option>
                <option value="Lunes">${lang === 'en' ? 'Monday (12:30-20:00) - Free' : 'Lunes (12:30-20:00) - Gratis'}</option>
                <option value="Martes">${lang === 'en' ? 'Tuesday (12:30-20:00) - DOP 100' : 'Martes (12:30-20:00) - DOP 100'}</option>
                <option value="Miércoles">${lang === 'en' ? 'Wednesday (12:30-20:00) - Free' : 'Miércoles (12:30-20:00) - Gratis'}</option>
                <option value="Jueves">${lang === 'en' ? 'Thursday (12:30-20:00) - DOP 100' : 'Jueves (12:30-20:00) - DOP 100'}</option>
                <option value="Viernes">${lang === 'en' ? 'Friday (12:30-20:00) - Free' : 'Viernes (12:30-20:00) - Gratis'}</option>
                <option value="Sábado">${lang === 'en' ? 'Saturday (12:30-20:00) - DOP 100' : 'Sábado (12:30-20:00) - DOP 100'}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="lang-es">Dirección de entrega</span>
                <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Delivery address</span>
              </label>
              <textarea name="direccion" required rows="3"
                        placeholder="${lang === 'en' ? 'Delivery address' : 'Dirección de entrega'}"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">${escaparAttr(direccionDefault)}</textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="lang-es">Observaciones (opcional)</span>
                <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Notes (optional)</span>
              </label>
              <textarea name="observaciones" rows="2"
                        placeholder="${lang === 'en' ? 'Notes (optional)' : 'Observaciones (opcional)'}"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">${escaparAttr(observacionesDefault)}</textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                <span class="lang-es">Modo de pago</span>
                <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Payment method</span>
              </label>
              <select name="pago" required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">${lang === 'en' ? 'Select method' : 'Seleccionar método'}</option>
                <option value="Cash" ${pagoDefault === 'Cash' ? 'selected' : ''}>${lang === 'en' ? 'Cash' : 'Efectivo'}</option>
                <option value="Transferencia" ${pagoDefault === 'Transferencia' ? 'selected' : ''}>${lang === 'en' ? 'Bank Transfer' : 'Transferencia'}</option>
                <option value="PayPal" ${pagoDefault === 'PayPal' ? 'selected' : ''}>PayPal (+10%)</option>
              </select>
            </div>

            <div class="flex justify-end gap-4 mt-6">
              <button type="button" onclick="resetCarritoDialog(); document.getElementById('dlg-carrito').close(); window.estadoFlujoCarrito = 'lista'; renderCarrito();"
                      class="px-4 py-2 text-gray-600 hover:text-gray-800">
                <span class="lang-es">Cancelar</span>
                <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Cancel</span>
              </button>
              <button type="submit"
                      class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <span class="lang-es">Enviar pedido</span>
                <span class="lang-en" style="display:${lang === 'en' ? '' : 'none'};">Send order</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  setLanguage(lang);
  document.getElementById('form-pedido')?.addEventListener('submit', enviarPedido);
}

function snapshotFormData(formData) {
  const data = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  return data;
}

function clonarCarrito(carrito) {
  return carrito.map(item => ({
    ...item,
    preferencias: item.preferencias
      ? {
          like: [...item.preferencias.like],
          dislike: [...item.preferencias.dislike]
        }
      : undefined
  }));
}

function obtenerEtiquetaPago(metodo, lang) {
  if (!metodo) return lang === 'en' ? 'Not specified' : 'No especificado';
  if (metodo === 'Cash') return lang === 'en' ? 'Cash' : 'Efectivo';
  if (metodo === 'Transferencia') return lang === 'en' ? 'Bank Transfer' : 'Transferencia';
  if (metodo === 'PayPal') return 'PayPal (+10%)';
  return metodo;
}

function generarResumenPedido(carrito, formEntries, lang) {
  const datos = formEntries instanceof FormData ? snapshotFormData(formEntries) : { ...formEntries };
  const subtotal = carrito.reduce((sum, item) => sum + (item.precio || 0) * (item.cantidad || 1), 0);
  const diaSeleccionado = datos.dia || '';
  const shipping = DIAS_CON_CARGO.includes(diaSeleccionado) ? 100 : 0;
  let total = subtotal + shipping;
  let paypalFee = 0;

  if (datos.pago === 'PayPal') {
    paypalFee = total * 0.10;
    total += paypalFee;
  }

  const lineasProductos = carrito.map(item => {
    const qty = item.cantidad || 1;
    const totalItem = (item.precio || 0) * qty;
    let linea = `- "${item.nombre}" (x${qty}) - DOP ${totalItem.toFixed(2)}`;
    const extras = [];
    if (item.variedad) {
      extras.push(`${lang === 'en' ? 'Variety' : 'Variedad'}: ${item.variedad}`);
    }
    if (item.preferencias?.like?.length) {
      extras.push(`${lang === 'en' ? 'Likes' : 'Gustos'}: ${item.preferencias.like.join(', ')}`);
    }
    if (item.preferencias?.dislike?.length) {
      extras.push(`${lang === 'en' ? 'Dislikes' : 'No me gusta'}: ${item.preferencias.dislike.join(', ')}`);
    }
    if (extras.length) {
      linea += `\n  - ${extras.join('\n  - ')}`;
    }
    return linea;
  }).join('\n');

  const totalLines = [
    `${lang === 'en' ? 'Subtotal' : 'Subtotal'}: DOP ${subtotal.toFixed(2)}`
  ];
  if (shipping > 0) {
    totalLines.push(`${lang === 'en' ? 'Shipping' : 'Envío'}: DOP ${shipping.toFixed(2)}`);
  }
  if (paypalFee > 0) {
    totalLines.push(`${lang === 'en' ? 'PayPal fee (10%)' : 'Comisión PayPal (10%)'}: DOP ${paypalFee.toFixed(2)}`);
  }
  totalLines.push(`${lang === 'en' ? '*Total to Pay: DOP ' : '*Total a pagar: DOP '}${total.toFixed(2)}*`);

  const diaDisplay = lang === 'en'
    ? (DIA_TRADUCCION_EN[diaSeleccionado] || diaSeleccionado)
    : diaSeleccionado;

  const notas = (datos.observaciones || '').trim() || (lang === 'en' ? 'No notes.' : 'Sin observaciones.');
  const metodoPago = obtenerEtiquetaPago(datos.pago, lang);

  const saludo = lang === 'en'
    ? 'Hello GreenDolio! 👋 I would like to confirm my order:'
    : '¡Hola GreenDolio! 👋 Quisiera confirmar mi pedido:';

  const seccionCliente = [
    lang === 'en' ? '*👤 CUSTOMER DETAILS:*' : '*👤 DATOS DEL CLIENTE:*',
    `- ${lang === 'en' ? 'Name' : 'Nombre'}: ${datos.nombre || ''}`,
    datos.telefono ? `- ${lang === 'en' ? 'Phone' : 'Teléfono'}: ${datos.telefono}` : null,
    `- ${lang === 'en' ? 'Address' : 'Dirección'}: ${datos.direccion || ''}`,
    `- ${lang === 'en' ? 'Delivery day' : 'Día de entrega'}: ${diaDisplay || '-'}`
  ].filter(Boolean).join('\n');

  const seccionProductos = [
    lang === 'en' ? '*🛒 ORDER SUMMARY:*' : '*🛒 RESUMEN DEL PEDIDO:*',
    lineasProductos || (lang === 'en' ? 'No items added.' : 'Sin productos agregados.')
  ].join('\n');

  const seccionTotal = [
    lang === 'en' ? '*💰 TOTAL:*' : '*💰 TOTAL:*',
    totalLines.join('\n')
  ].join('\n');

  const seccionPago = [
    lang === 'en' ? '*💳 PAYMENT METHOD:*' : '*💳 MÉTODO DE PAGO:*',
    metodoPago
  ].join('\n');

  const seccionNotas = [
    lang === 'en' ? '*📝 NOTES:*' : '*📝 OBSERVACIONES:*',
    notas
  ].join('\n');

  const mensaje = [
    saludo,
    seccionCliente,
    seccionProductos,
    seccionTotal,
    seccionPago,
    seccionNotas
  ].join('\n\n').trim();

  return {
    mensaje,
    subtotal,
    shipping,
    paypalFee,
    total,
    formulario: datos,
    carrito: clonarCarrito(carrito),
    lang
  };
}

function cerrarModalResumen() {
  const modalResumen = document.getElementById('modal-resumen');
  if (!modalResumen) return;
  modalResumen.classList.add('hidden');
  const bottomBar = document.getElementById('bottom-bar');
  if (bottomBar) bottomBar.style.display = 'flex';
}

function mostrarResumenPedido(resumen) {
  const modalResumen = document.getElementById('modal-resumen');
  const detalle = document.getElementById('detalle-resumen');
  const total = document.getElementById('total-resumen');
  if (!modalResumen || !detalle || !total) {
    console.warn('Modal de resumen no disponible en el DOM.');
    return;
  }
  detalle.textContent = resumen.mensaje;
  total.textContent = `DOP ${resumen.total.toFixed(2)}`;
  modalResumen.classList.remove('hidden');
  const bottomBar = document.getElementById('bottom-bar');
  if (bottomBar) bottomBar.style.display = 'none';
}

function enviarPedido(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  const lang = document.documentElement.lang || 'es';

  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito) || carrito.length === 0) {
    alert(lang === 'en' ? 'The cart is empty' : 'El carrito está vacío');
    return;
  }

  const tieneCajas = carrito.some(item => item.tipo === 'caja');
  const subtotal = carrito.reduce(
    (sum, item) => sum + item.precio * (item.cantidad || 1),
    0
  );

  if (!tieneCajas && subtotal < 500) {
    const faltante = 500 - subtotal;
    alert(lang === 'en' 
      ? `Minimum order: DOP 500. You need DOP ${faltante.toFixed(2)} more.`
      : `Pedido mínimo: DOP 500. Te faltan DOP ${faltante.toFixed(2)}.`
    );
    return;
  }

  const telefonoCliente = formData.get('telefono') || '';
  const direccionCliente = formData.get('direccion') || '';
  const metodoPago = formData.get('pago') || '';

  if (typeof firebase !== 'undefined') {
    const user = firebase.auth().currentUser;
    if (user) {
      try {
        firebase.firestore().collection('users').doc(user.uid).set({
          telefono: telefonoCliente,
          direccion: direccionCliente,
          pagoPreferido: metodoPago
        }, { merge: true });
      } catch (err) {
        console.warn('No se pudo actualizar el perfil del usuario:', err);
      }
      window.userProfile = {
        ...(window.userProfile || {}),
        telefono: telefonoCliente,
        direccion: direccionCliente,
        pagoPreferido: metodoPago
      };
    }
  }

  const resumen = generarResumenPedido(carrito, formData, lang);
  window.ultimoResumenPedido = resumen;
  mostrarResumenPedido(resumen);
  const dialogCarrito = document.getElementById('dlg-carrito');
  if (dialogCarrito?.close) {
    dialogCarrito.close();
    window.estadoFlujoCarrito = 'lista';
    if (typeof window.resetCarritoDialog === 'function') {
      window.resetCarritoDialog();
    }
  }
}

function enviarPedidoWhatsApp() {
  const lang = document.documentElement.lang || 'es';
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  if (!Array.isArray(carrito) || carrito.length === 0) {
    alert(lang === 'en' ? 'The cart is empty' : 'El carrito está vacío');
    cerrarModalResumen();
    return;
  }

  let resumen = window.ultimoResumenPedido;
  if (!resumen) {
    const form = document.getElementById('form-pedido');
    if (!form) {
      console.warn('Formulario de pedido no encontrado.');
      return;
    }
    const formData = new FormData(form);
    resumen = generarResumenPedido(carrito, formData, lang);
  }

  const numeroWhatsApp = '18097537338';
  const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(resumen.mensaje)}`;
  window.open(url, '_blank');
  cerrarModalResumen();
  localStorage.setItem('carrito', '[]');
  renderCarrito();
  guardarCarritoEnFirebase();
  window.ultimoResumenPedido = null;
}


/* ----------  MULTI‑IDIOMA ---------- */
function setLanguage(lang){
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
  document.querySelectorAll('.lang-es').forEach(el => el.style.display = (lang === 'es' ? '' : 'none'));
  document.querySelectorAll('.lang-en').forEach(el => el.style.display = (lang === 'en' ? '' : 'none'));
  // resaltado del selector
  document.getElementById('btn-es')?.classList.toggle('ring-4', lang === 'es');
  document.getElementById('btn-en')?.classList.toggle('ring-4', lang === 'en');
  document.querySelectorAll('.config-caja-btn').forEach(actualizarTooltipConfigBtn);
  actualizarBotonesAgregar();
  
  // Actualizar link de WhatsApp del footer
  const btnWhatsApp = document.getElementById('btn-whatsapp-footer');
  if (btnWhatsApp) {
    const mensaje = lang === 'en' 
      ? 'Hello GreenDolio! I would like to place an order.'
      : 'Hola GreenDolio! Me gustaría hacer un pedido.';
    btnWhatsApp.href = `https://wa.me/18097537338?text=${encodeURIComponent(mensaje)}`;
  }
}

/* ----------  HAMBURGER MENU ---------- */
function toggleMobileMenu(){
  const menu = document.getElementById('mobile-menu');
  if(menu) {
    menu.classList.toggle('hidden');
    // Asegurar que el menú se muestre correctamente
    if(!menu.classList.contains('hidden')) {
      menu.style.display = 'flex';
    } else {
      menu.style.display = 'none';
    }
  }
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(event) {
  const menu = document.getElementById('mobile-menu');
  const menuToggle = document.getElementById('menu-toggle');
  
  if (menu && !menu.classList.contains('hidden') && 
      !menu.contains(event.target) && 
      !menuToggle.contains(event.target)) {
    menu.classList.add('hidden');
  }
});

function sanitizeNombreProducto(nombre) {
  if (!nombre) return '';
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/["'«»“”‘’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const TARJETAS_REFERENCIA_05NOV = {
  "aguacate": { precio: 100, unidadVenta: 'unidad', pesoAproximado: '0.66 lb (300 g aprox.)' },
  "mandarina": { precio: 45, unidadVenta: 'unidad', pesoAproximado: '0.2-0.3 lb (90-135 g)' },
  "chinola": { precio: 35, unidadVenta: 'unidad', pesoAproximado: '0.15-0.25 lb (70-115 g)' },
  "platano maduro": { precio: 25, unidadVenta: 'unidad', pesoAproximado: '0.4-0.5 lb (180-225 g)' },
  "pina pequena": { precio: 80, unidadVenta: 'unidad', pesoAproximado: '2-3 lb (0.9-1.4 kg)' },
  "fresas": { precio: 150, unidadVenta: 'paquete (1 lb)', pesoAproximado: '1 lb (18-20 unidades)' },
  "mango": { precio: 50, unidadVenta: 'unidad', pesoAproximado: '0.5-0.8 lb (225-360 g)' },
  "coco": { precio: 75, unidadVenta: 'unidad', pesoAproximado: '1.5-2.5 lb (0.7-1.1 kg)' },
  "lechosa": { precio: 85, unidadVenta: 'unidad', pesoAproximado: '2-4 lb (0.9-1.8 kg)' },
  "banana": { precio: 15, unidadVenta: 'unidad', pesoAproximado: '0.3-0.4 lb (135-180 g)' },
  "cerezas": { precio: 125, unidadVenta: 'libra', pesoAproximado: '1 lb' },
  "manzana": { precio: 85, unidadVenta: 'unidad', pesoAproximado: '0.4-0.55 lb (180-250 g)' },
  "sandia": { precio: 200, unidadVenta: 'unidad', pesoAproximado: '8-12 lb (3.5-5.5 kg)' },
  "melon": { precio: 125, unidadVenta: 'unidad', pesoAproximado: '3-5 lb (1.4-2.3 kg)' },
  "melon frances": { precio: 185, unidadVenta: 'unidad', pesoAproximado: '2-3 lb (0.9-1.4 kg)' },
  "pitahaya": { precio: 67, unidadVenta: 'unidad', pesoAproximado: '0.5-0.75 lb (225-340 g)' },
  "uvas blancas": { precio: 275, unidadVenta: 'libra', pesoAproximado: '0.5 lb' },
  "uvas moradas": { precio: 225, unidadVenta: 'libra', pesoAproximado: '0.5 lb' },
  "naranja": { precio: 80, unidadVenta: 'unidad', pesoAproximado: '0.4-0.5 lb (180-225 g)' },
  "naranjas": { precio: 80, unidadVenta: 'unidad', pesoAproximado: '0.4-0.5 lb (180-225 g)' },
  "carambola": { precio: 40, unidadVenta: 'unidad', pesoAproximado: '0.2-0.3 lb (90-135 g)' },
  "tomate bugalu": { precio: 25, unidadVenta: 'unidad', pesoAproximado: '0.2 lb' },
  "papas": { precio: 25, unidadVenta: 'unidad', pesoAproximado: '0.6-0.8 lb (270-360 g)' },
  "platano verde": { precio: 20, unidadVenta: 'unidad', pesoAproximado: '1 lb' },
  "lechuga rizada": { precio: 50, unidadVenta: 'unidad', pesoAproximado: '0.8-1.2 lb (360-545 g)' },
  "calabaza": { precio: 300, unidadVenta: 'unidad', pesoAproximado: '2-5 lb (unidad típica)' },
  "berenjena": { precio: 40, unidadVenta: 'unidad', pesoAproximado: '0.5-0.8 lb (225-360 g)' },
  "lechuga repollada": { precio: 75, unidadVenta: 'unidad', pesoAproximado: '1-1.5 lb (455-680 g)' },
  "lechuga romana": { precio: 85, unidadVenta: 'unidad', pesoAproximado: '1-1.5 lb (455-680 g)' },
  "rabano": { precio: 85, unidadVenta: 'libra', pesoAproximado: '1 lb' },
  "pepino": { precio: 25, unidadVenta: 'unidad', pesoAproximado: '1 lb' },
  "guineo verde": { precio: 15, unidadVenta: 'unidad', pesoAproximado: '0.5-0.75 lb (225-340 g)' },
  "yuca": { precio: 45, unidadVenta: 'libra', pesoAproximado: '1 lb' },
  "repollo blanco": { precio: 150, unidadVenta: 'unidad', pesoAproximado: '2-3 lb (0.9-1.4 kg)' },
  "repollo morado": { precio: 140, unidadVenta: 'unidad', pesoAproximado: '2-3 lb (0.9-1.4 kg)' },
  "tomate redondo": { precio: 50, unidadVenta: 'libra', pesoAproximado: '0.3 lb' },
  "coliflor": { precio: 175, unidadVenta: 'unidad', pesoAproximado: '1.5-2.5 lb (680 g-1.1 kg)' },
  "brocoli": { precio: 125, unidadVenta: 'unidad', pesoAproximado: '0.8-1.2 lb (360-545 g)' },
  "ajo": { precio: 45, unidadVenta: 'unidad', pesoAproximado: '0.3-0.4 lb (135-180 g)' },
  "cebolla morada amarilla": { precio: 35, unidadVenta: 'unidad', pesoAproximado: '0.4-0.6 lb (180-270 g)' },
  "cebolla amarilla": { precio: 35, unidadVenta: 'unidad', pesoAproximado: '0.4-0.6 lb (180-270 g)' },
  "cebolla morada": { precio: 35, unidadVenta: 'unidad', pesoAproximado: '0.4-0.6 lb (180-270 g)' },
  "zanahoria": { precio: 15, unidadVenta: 'unidad', pesoAproximado: '0.15-0.25 lb (70-115 g)' },
  "batata": { precio: 25, unidadVenta: 'unidad', pesoAproximado: '0.4-0.6 lb (180-270 g)' },
  "aji morron": { precio: 45, unidadVenta: 'unidad', pesoAproximado: '0.3-0.5 lb (135-225 g)' },
  "aji morrones": { precio: 45, unidadVenta: 'unidad', pesoAproximado: '0.3-0.5 lb (135-225 g)' },
  "maiz": { precio: 40, unidadVenta: 'unidad', pesoAproximado: '0.6-0.8 lb (270-360 g)' },
  "limon": { precio: 35, unidadVenta: 'unidad', pesoAproximado: '0.12-0.18 lb (55-80 g)' },
  "name": { precio: 100, unidadVenta: 'unidad', pesoAproximado: '1-2 lb (455-910 g)' },
  "zucchini": { precio: 35, unidadVenta: 'unidad', pesoAproximado: '0.4-0.6 lb (180-270 g)' },
  "zuccini": { precio: 35, unidadVenta: 'unidad', pesoAproximado: '0.4-0.6 lb (180-270 g)' },
  "cilantro": { precio: 25, unidadVenta: 'manojo', pesoAproximado: '125 g' },
  "jengibre": { precio: 65, unidadVenta: 'manojo', pesoAproximado: '125 g' },
  "genjibre": { precio: 65, unidadVenta: 'manojo', pesoAproximado: '125 g' },
  "oregano": { precio: 75, unidadVenta: 'manojo', pesoAproximado: '125 g' },
  "perejil": { precio: 35, unidadVenta: 'manojo', pesoAproximado: '125 g' },
  "romero": { precio: 75, unidadVenta: 'manojo', pesoAproximado: '125 g' },
  "apio": { precio: 90, unidadVenta: 'manojo', pesoAproximado: '125 g' },
  "anis estrellado": { precio: 40, unidadVenta: '30 gr', pesoAproximado: '30 g' },
  "laurel": { precio: 35, unidadVenta: '15 gr', pesoAproximado: '15 g' },
  "pimienta negra entera": { precio: 30, unidadVenta: 'gramos', pesoAproximado: '100 g' },
  "clavo dulce": { precio: 25, unidadVenta: '15 gr', pesoAproximado: '15 g' }
};

const PRODUCTOS_SOLO_PESO_400G = new Set([
  'arroz blanco',
  'arroz integral',
  'lentejas',
  'habichuelas rojas',
  'habichuelas negras',
  'habichuelas blancas'
]);

const DETALLES_FORZADOS_400G = new Set([
  'quinoa',
  'arroz integral',
  'lentejas',
  'habichuelas rojas',
  'habichuelas negras',
  'habichuelas blancas'
]);

const UNIDADES_TRADUCCION = {
  'unidad': { es: 'Unidad', en: 'Unit' },
  'libra': { es: 'Libra', en: 'Pound' },
  'paquete (1 lb)': { es: 'Paquete 1 lb', en: 'Pack (1 lb)' },
  'manojo': { es: 'Manojo', en: 'Bundle' },
  '30 gr': { es: 'Paquete 30 g', en: '30 g pack' },
  '15 gr': { es: 'Paquete 15 g', en: '15 g pack' },
  'gramos': { es: 'Gramos', en: 'Grams' }
};

function traducirUnidad(unidad, idioma) {
  if (!unidad) return '';
  const clave = unidad.toLowerCase();
  return UNIDADES_TRADUCCION[clave]?.[idioma] || unidad.charAt(0).toUpperCase() + unidad.slice(1);
}

function construirDetalleProfesional(unidad, peso, idioma, claveNombre) {
  if (PRODUCTOS_SOLO_PESO_400G.has(claveNombre)) {
    const unidadTexto = idioma === 'en' ? 'Pack' : 'Paquete';
    return `${unidadTexto} • 400 g`;
  }
  const unidadTexto = traducirUnidad(unidad, idioma);
  if (unidadTexto && peso) return `${unidadTexto} • ${peso}`;
  if (unidadTexto) return unidadTexto;
  return peso || '';
}

let indiceProductosTarjetas = null;
function construirIndiceProductos() {
  if (indiceProductosTarjetas) return indiceProductosTarjetas;
  const indice = {};
  for (const categoria of Object.keys(PRODUCTOS_CONFIG || {})) {
    const catalogo = PRODUCTOS_CONFIG[categoria];
    if (!catalogo) continue;
    for (const id of Object.keys(catalogo)) {
      const producto = catalogo[id];
      const nombres = [];
      if (producto?.nombre) {
        if (typeof producto.nombre === 'string') {
          nombres.push(producto.nombre);
        } else {
          nombres.push(...Object.values(producto.nombre));
        }
      }
      nombres.push(id);
      nombres.forEach(nombre => {
        const clave = sanitizeNombreProducto(nombre);
        if (clave && !indice[clave]) {
          indice[clave] = { categoria, id, producto };
        }
      });
    }
  }
  indiceProductosTarjetas = indice;
  return indiceProductosTarjetas;
}

function obtenerRegistroProducto(nombre) {
  return construirIndiceProductos()[sanitizeNombreProducto(nombre)];
}

function formatearPrecioDOP(valor) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return valor;
  return `DOP ${numero}`;
}

function insertarDetalleProducto(card, boton, clase, texto) {
  if (!texto) return null;
  let nodo = card.querySelector(`.detalle-producto.${clase}`);
  if (!nodo) {
    nodo = document.createElement('p');
    nodo.className = `detalle-producto ${clase}`;
    card.insertBefore(nodo, boton);
  }
  const match = texto.match(/^(.*?)(\s*\(.*\))$/);
  const principal = (match ? match[1] : texto).trim();
  const extra = match ? match[2].trim() : '';
  nodo.replaceChildren();
  const linea = document.createElement('span');
  linea.className = 'detalle-producto-linea';
  linea.textContent = principal;
  nodo.appendChild(linea);
  if (extra) {
    const extraSpan = document.createElement('span');
    extraSpan.className = 'detalle-producto-extra';
    extraSpan.textContent = extra;
    nodo.appendChild(extraSpan);
  }
  return nodo;
}

function actualizarTarjetasProductos() {
  document.querySelectorAll('.paso-card').forEach(card => {
    const boton = card.querySelector('.agregar-carrito');
    if (!boton) return;

    const nombreEsNode = card.querySelector('.lang-es');
    if (!nombreEsNode) return;

    const claveNombre = sanitizeNombreProducto(nombreEsNode.textContent);
    const registro = obtenerRegistroProducto(nombreEsNode.textContent);
    const datosReferencia = TARJETAS_REFERENCIA_05NOV[claveNombre];
    const producto = registro?.producto;

    const precio = (producto?.precio ?? producto?.detalles?.precio ?? datosReferencia?.precio);
    const precioEsNode = card.querySelector('p.lang-es');
    const precioEnNode = card.querySelector('p.lang-en');
    if (precioEsNode && typeof precio !== 'undefined') {
      precioEsNode.textContent = formatearPrecioDOP(precio);
    }
    if (precioEnNode && typeof precio !== 'undefined') {
      precioEnNode.textContent = formatearPrecioDOP(precio);
    }

    const descripcion = producto?.descripcion || {};
    const unidad = producto?.detalles?.unidadVenta || datosReferencia?.unidadVenta;
    const peso = producto?.detalles?.pesoAproximado || datosReferencia?.pesoAproximado;
    let detalleEs =
      descripcion.es ||
      producto?.detalles?.descripcionCorta ||
      (unidad || peso ? construirDetalleProfesional(unidad, peso, 'es', claveNombre) : '') ||
      (typeof generarDescripcionProfesional === 'function'
        ? generarDescripcionProfesional(unidad, peso)
        : '');
    let detalleEn =
      descripcion.en ||
      producto?.detalles?.descripcionCorta ||
      (unidad || peso ? construirDetalleProfesional(unidad, peso, 'en', claveNombre) : '') ||
      (typeof generarDescripcionProfesional === 'function'
        ? generarDescripcionProfesional(unidad, peso)
        : detalleEs);

    if (DETALLES_FORZADOS_400G.has(claveNombre)) {
      detalleEs = 'Porción · 400 g';
      detalleEn = 'Portion · 400 g';
    }

    insertarDetalleProducto(card, boton, 'lang-es', detalleEs);
    insertarDetalleProducto(card, boton, 'lang-en', detalleEn || detalleEs);
  });
}

function actualizarBotonesAgregar() {
  const lang = obtenerIdiomaActual();
  document.querySelectorAll('.agregar-carrito').forEach(btn => {
    if (!btn.classList.contains('gap-2')) {
      btn.classList.add('gap-2');
    }

    Array.from(btn.querySelectorAll('span')).forEach(span => {
      if (!span.classList.contains('lang-es') && !span.classList.contains('lang-en')) {
        const texto = span.textContent.trim().toLowerCase();
        if (texto.includes('agreg')) {
          span.className = 'lang-es';
        } else if (texto.includes('add')) {
          span.className = 'lang-en';
        } else {
          span.remove();
        }
      }
    });

    Array.from(btn.childNodes).forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        node.remove();
      }
    });

    const spansEs = Array.from(btn.querySelectorAll('.lang-es'));
    let spanEs = spansEs.shift() || null;
    spansEs.forEach(extra => extra.remove());

    const spansEn = Array.from(btn.querySelectorAll('.lang-en'));
    let spanEn = spansEn.shift() || null;
    spansEn.forEach(extra => extra.remove());

    let icono = btn.querySelector('i.fas.fa-cart-plus');

    if (!icono) {
      icono = document.createElement('i');
      icono.className = 'fas fa-cart-plus';
      btn.insertAdjacentElement('afterbegin', icono);
    }

    if (!spanEs) {
      spanEs = document.createElement('span');
      spanEs.className = 'lang-es';
      spanEs.textContent = 'Agregar';
      btn.appendChild(spanEs);
    } else if (!spanEs.textContent.trim()) {
      spanEs.textContent = 'Agregar';
    }

    if (!spanEn) {
      spanEn = document.createElement('span');
      spanEn.className = 'lang-en';
      spanEn.textContent = 'Add';
      btn.appendChild(spanEn);
    } else if (!spanEn.textContent.trim()) {
      spanEn.textContent = 'Add';
    }

    spanEs.style.display = lang === 'es' ? '' : 'none';
    spanEn.style.display = lang === 'en' ? '' : 'none';
    spanEs.hidden = lang !== 'es';
    spanEn.hidden = lang !== 'en';
    spanEs.setAttribute('aria-hidden', lang === 'es' ? 'false' : 'true');
    spanEn.setAttribute('aria-hidden', lang === 'en' ? 'false' : 'true');
  });
}

// Refuerzo: Solo abrir el formulario si el usuario presiona continuar
function handleContinuarPedido() {
  // Validación de pedido mínimo antes de mostrar el formulario
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  const lang = obtenerIdiomaActual();
  const tieneCajas = carrito.some(item => item.tipo === 'caja');
  const subtotal = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
  if (!tieneCajas && subtotal < 500) {
    const faltante = 500 - subtotal;
    alert(lang === 'en' 
      ? `Minimum order: DOP 500. You need DOP ${faltante.toFixed(2)} more.`
      : `Pedido mínimo: DOP 500. Te faltan DOP ${faltante.toFixed(2)}.`
    );
    return;
  }

  if (typeof firebase !== 'undefined') {
    const user = firebase.auth().currentUser;
    if (!user) {
      mostrarNotificacion(lang === 'en'
        ? 'Please sign in or create an account to complete your order.'
        : 'Inicia sesión o crea tu cuenta para completar el pedido.');
      window.estadoFlujoCarrito = 'lista';
      renderCarrito();
      window.iniciarSesion?.();
      return;
    }
  }

  window.estadoFlujoCarrito = 'formulario';
  mostrarFormularioPedido();
}

// NUEVA FUNCIÓN: Se activa al hacer clic en un botón de variedad.
function iniciarConfiguracionCaja(btn) {
    playWaterDrop();
    const boxId = normalizarBoxId(btn.dataset.box);
    const variedad = btn.dataset.variedad;
    if (!boxId) return;

    // Resetea otras cajas para evitar confusiones
    resetearCajasExcepto(boxId);

    // Crea el estado si no existe
    if (!estadoCajas[boxId]) {
        estadoCajas[boxId] = { variedad: null, like: [], dislike: [], ok: false };
    }

    // Guarda la variedad y abre la sección de configuración
    estadoCajas[boxId].variedad = variedad;
    cajaActual = boxId;
    
    // Actualiza el estilo de los botones de esa tarjeta
    const card = btn.closest('.caja-hover');
    card?.querySelectorAll('.variedad-btn').forEach(b => {
        b.classList.remove('selected', 'bg-green-600', 'text-white');
        b.classList.add('bg-green-100', 'text-green-800');
    });
    btn.classList.add('selected', 'bg-green-600', 'text-white');

    actualizarBotonConfig(boxId);
    // Abre la sección de configuración
    abrirConfig(boxId);
}

// NUEVA FUNCIÓN CENTRALIZADA para agregar items al carrito
function agregarAlCarrito(item) {
    // Limpiar el carrito al iniciar si no existe
    if (!localStorage.getItem('carrito')) {
        localStorage.setItem('carrito', '[]');
    }

    let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    if (!Array.isArray(carrito)) carrito = [];

    // Buscar si ya existe un item idéntico
    const itemExistente = carrito.find(i => 
        i.nombre === item.nombre && 
        i.variedad === item.variedad && 
        i.autoMode === item.autoMode
    );

    if (itemExistente) {
        // Si existe, solo actualizar la cantidad
        itemExistente.cantidad = (itemExistente.cantidad || 1) + 1;
        const lang = localStorage.getItem('lang') || 'es';
        mostrarNotificacion(lang === 'en' ? 'Quantity updated in cart' : 'Cantidad actualizada en el carrito');
    } else {
        // Si no existe, agregar como nuevo item
        item.cantidad = 1;
        carrito.push(item);
        const lang = localStorage.getItem('lang') || 'es';
        const message = item.tipo === 'caja'
          ? (lang === 'en' ? 'Box added to cart' : 'Caja agregada al carrito')
          : (lang === 'en' ? 'Product added to cart' : 'Producto agregado al carrito');
        mostrarNotificacion(message);
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));
    renderCarrito();
    guardarCarritoEnFirebase();
}

// Función para limpiar el carrito al iniciar la página
function inicializarCarrito() {
    const carritoActual = localStorage.getItem('carrito');
    if (!carritoActual) {
        localStorage.setItem('carrito', '[]');
    }
    renderCarrito();
}

function actualizarCarritoUsuario(uid, carrito) {
  if (typeof firebase === 'undefined' || !uid) return Promise.resolve();
  try {
    const db = firebase.firestore();
    return db.collection('users')
      .doc(uid)
      .set({ carrito }, { merge: true });
  } catch (error) {
    console.error('Error al preparar la actualización del carrito en Firebase:', error);
    return Promise.reject(error);
  }
}

function guardarCarritoEnFirebase() {
  if (typeof firebase === 'undefined') return Promise.resolve();
  const uid = window.currentUserId || firebase.auth().currentUser?.uid;
  if (!uid) return Promise.resolve();

  try {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
    return actualizarCarritoUsuario(uid, carrito).catch(error => {
      console.error('Error al sincronizar el carrito con Firebase: ', error);
    });
  } catch (error) {
    console.error('Error al preparar el carrito para Firebase:', error);
    return Promise.reject(error);
  }
}

function guardarPerfilDeUsuario(user) {
  if (!user || typeof firebase === 'undefined') return;

  delete window.profileSetupPending;

  const seccionFormulario = document.getElementById('profile-setup');
  const formulario = document.getElementById('profile-form');
  if (!seccionFormulario || !formulario) return;

  const closeKey = `profileSetupClosed_${user.uid}`;
  if (localStorage.getItem('profileSetupClosed') === '1') {
    localStorage.removeItem('profileSetupClosed');
  }
  if (localStorage.getItem(closeKey) === '1') {
    seccionFormulario.classList.add('hidden');
    return;
  }

  seccionFormulario.classList.remove('hidden');
  seccionFormulario.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const nombreInput = document.getElementById('nombre');
  if (nombreInput) nombreInput.value = user.displayName || '';

  if (formulario.dataset.bound === user.uid) return;
  formulario.dataset.bound = user.uid;

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const telefono = document.getElementById('telefono')?.value || '';
    const direccion = document.getElementById('direccion')?.value || '';
    const pagoPreferido = document.getElementById('pago-preferido')?.value || '';
    const likes = document.getElementById('likes')?.value || '';
    const dislikes = document.getElementById('dislikes')?.value || '';
    const comoNosConocio = document.getElementById('como-nos-conocio')?.value || '';

    const db = firebase.firestore();

    db.collection("users").doc(user.uid).set({
      displayName: user.displayName || window.userProfile?.displayName || '',
      email: user.email || window.userProfile?.email || '',
      telefono,
      direccion,
      pagoPreferido,
      likes,
      dislikes,
      comoNosConocio,
      carrito: JSON.parse(localStorage.getItem('carrito') || '[]'),
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
      seccionFormulario.classList.add('hidden');
      const lang = obtenerIdiomaActual();
      mostrarNotificacion(lang === 'en' ? 'Profile saved! Thank you.' : '¡Gracias! Tu perfil ha sido guardado.');
      localStorage.removeItem(closeKey);
      window.userProfile = {
        ...(window.userProfile || {}),
        displayName: user.displayName || window.userProfile?.displayName || '',
        email: user.email || window.userProfile?.email || '',
        telefono,
        direccion,
        pagoPreferido,
        likes,
        dislikes,
        comoNosConocio
      };
    })
    .catch((error) => {
      console.error("Error al guardar el perfil: ", error);
      mostrarNotificacion("Hubo un error al guardar tu perfil. Por favor, intenta de nuevo.");
    });
  });
}

/* ----------  AUTO-MODE ---------- */
function agregarCajaAutoMode() {
  playWaterDrop();
  const boxId = normalizarBoxId(cajaActual);
  if (!boxId) {
    alert('Error: No se ha seleccionado ninguna caja.');
    return;
  }

  // Obtiene los datos de la tarjeta HTML para crear el item del carrito
  let card = document.querySelector(`.caja-hover[data-box="${boxId}"]`);
  // Si no se encuentra, intenta con diferentes formatos
  if (!card) {
    const numeroCaja = obtenerNumeroCaja(boxId);
    card = document.querySelector(`.caja-hover[data-box="box${numeroCaja}"]`) ||
           document.querySelector(`.caja-hover[data-box="${numeroCaja}"]`) ||
           document.querySelector(`.caja-hover[data-box="box-${numeroCaja}"]`);
  }
  if (!card) {
    console.error('No se encontró la tarjeta de la caja para:', boxId);
    alert('Error: No se encontró la tarjeta de la caja. Por favor, recarga la página.');
    return;
  }

  const numeroCaja = obtenerNumeroCaja(boxId);
  const nombre = card.querySelector('.text-3xl, .text-4xl')?.textContent.trim() || `Caja ${numeroCaja || boxId}`;
  const precio = parsePrecio(card.querySelector('.inline-block.bg-white')?.textContent);
  const variedad = card.querySelector('.variedad-btn.selected')?.textContent.trim() || 'Mix';

  const item = {
    tipo: 'caja',
    nombre: nombre,
    precio: isNaN(precio) ? 0 : precio,
    variedad: variedad,
    preferencias: { like: [], dislike: [] },
    cantidad: 1,
    autoMode: true
  };
  
  // Agrega al carrito
  agregarAlCarrito(item);

  // Oculta la sección de configuración y vuelve a la sección de cajas
  document.getElementById('configurar-caja').classList.add('hidden');
  document.querySelector('#cajas')?.scrollIntoView({ behavior: 'smooth' });
}

// Agregar el evento al botón AUTO-MODE
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-auto-mode')?.addEventListener('click', agregarCajaAutoMode);
});

function actualizarCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
  const contador = document.getElementById('contador-carrito');
  const total = document.getElementById('total-carrito');
  const lista = document.getElementById('lista-carrito');
  const btnContinuar = document.getElementById('btn-continuar');
  const btnVaciar = document.getElementById('btn-vaciar');
  const lang = document.documentElement.lang || 'es';

  // Verificar si hay cajas en el carrito
  const tieneCajas = carrito.some(item => item.tipo === 'caja');
  
  // Calcular subtotal
  const subtotal = carrito.reduce((sum, item) => sum + (item.precio * (item.cantidad || 1)), 0);
  
  // Calcular total con delivery si no hay cajas
  let totalConDelivery = subtotal;
  let mensajeDelivery = '';
  
  if (!tieneCajas) {
    if (subtotal < 500) {
      const faltante = 500 - subtotal;
      mensajeDelivery = lang === 'en' 
        ? `\nMinimum order: DOP 500. You need DOP ${faltante.toFixed(2)} more.`
        : `\nPedido mínimo: DOP 500. Te faltan DOP ${faltante.toFixed(2)}.`;
    } else {
      totalConDelivery += 100;
      mensajeDelivery = lang === 'en'
        ? '\nDelivery fee: DOP 100.00'
        : '\nCosto de delivery: DOP 100.00';
    }
  }

  // Actualizar contador
  contador.textContent = carrito.length;
  contador.style.display = carrito.length > 0 ? 'block' : 'none';

  // Actualizar total
  total.textContent = `DOP ${totalConDelivery.toFixed(2)}`;
  if (mensajeDelivery) {
    total.innerHTML += `<span class="text-sm text-red-600">${mensajeDelivery}</span>`;
  }

  // Actualizar lista
  lista.innerHTML = carrito.map((item, index) => `
    <div class="flex items-center justify-between py-2">
      <div class="flex-1">
        <span class="font-medium">${item.nombre}</span>
        ${item.variedad ? `<br><span class="text-sm text-gray-600">${item.variedad}</span>` : ''}
        ${item.preferencias ? `
          <br>
          ${item.preferencias.like.length > 0 ? `<span class="text-sm text-green-600">👍 ${item.preferencias.like.join(', ')}</span>` : ''}
          ${item.preferencias.dislike.length > 0 ? `<span class="text-sm text-red-600">👎 ${item.preferencias.dislike.join(', ')}</span>` : ''}
        ` : ''}
      </div>
      <div class="flex items-center gap-2">
        <button onclick="cambiarCantidad(${index}, -1)" class="text-gray-500 hover:text-gray-700">-</button>
        <span>${item.cantidad || 1}</span>
        <button onclick="cambiarCantidad(${index}, 1)" class="text-gray-500 hover:text-gray-700">+</button>
        <span class="ml-4">DOP ${(item.precio * (item.cantidad || 1)).toFixed(2)}</span>
        <button onclick="eliminarDelCarrito(${index})" class="ml-2 text-red-500 hover:text-red-700">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');

  // Actualizar botones
  btnContinuar.disabled = carrito.length === 0 || (!tieneCajas && subtotal < 500);
  btnVaciar.disabled = carrito.length === 0;
}
