// ====== SISTEMA DE GESTIÓN DE PRODUCTOS Y PRECIOS ======
// Este archivo centraliza toda la información de productos para facilitar actualizaciones

const PRODUCTOS_CONFIG = {
  // ====== CAJAS ======
  cajas: {
    box1: {
      id: 'box1',
      nombre: {
        es: 'BOX 1 "Caribbean Fresh Pack"',
        en: 'BOX 1 "Caribbean Fresh Pack"'
      },
      duracion: {
        es: '(3 días)',
        en: '(3 days)'
      },
      precio: 650,
      imagen: 'assets/images/boxes/Box1_optimized.png',
      contenido: {
        es: `🥥 **Caribbean fresh pack** (3 días)\n\n📦 Contenido referencia:\n1 ajo, 2 cebollas, 1 ají, 2 papas/batatas, 1 brócoli chico, 2 tomates, 1 lechuga/repollo, 1 plátano, 2 chinolas, 1 mango, 1 piña, 3 limones, apio + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`,
        en: `🥥 **Caribbean fresh pack** (3 days)\n\n📦 Reference content:\n1 garlic, 2 onions, 1 pepper, 2 potatoes/sweet potatoes, 1 small broccoli, 2 tomatoes, 1 lettuce/cabbage, 1 plantain, 2 passion fruits, 1 mango, 1 pineapple, 3 lemons, celery + surprises (parsley, cilantro, rosemary, oregano, cinnamon, etc.)`
      }
    },
    box2: {
      id: 'box2',
      nombre: {
        es: 'BOX 2 "Island Weekssential"',
        en: 'BOX 2 "Island Weekssential"'
      },
      duracion: {
        es: '(1 semana)',
        en: '(1 week)'
      },
      precio: 990,
      imagen: 'assets/images/boxes/Box2_optimized.png',
      contenido: {
        es: `🍍 **Weekssential** (1 semana)\n\n📦 Contenido referencia:\n1 ajo, 4 cebollas, 1 ají, 6 papas/batatas, 1 calabaza, 1 brócoli grande, 4 tomates, 1 lechuga, 1 repollo, 2 plátanos, 5 guineos verdes, 4 guineos maduros, fresas, 2 mangos, 1 piña, 1 lechosa, apio, 2 berenjenas + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`,
        en: `🍍 **Weekssential** (1 week)\n\n📦 Reference content:\n1 garlic, 4 onions, 1 pepper, 6 potatoes/sweet potatoes, 1 pumpkin, 1 large broccoli, 4 tomatoes, 1 lettuce, 1 cabbage, 2 plantains, 5 green bananas, 4 ripe bananas, strawberries, 2 mangos, 1 pineapple, 1 papaya, celery, 2 eggplants + surprises (parsley, cilantro, rosemary, oregano, cinnamon, etc.)`
      }
    },
    box3: {
      id: 'box3',
      nombre: {
        es: 'BOX 3 "Allgreenxclusive"',
        en: 'BOX 3 "Allgreenxclusive"'
      },
      duracion: {
        es: '(2 semanas)',
        en: '(2 weeks)'
      },
      precio: 1990,
      imagen: 'assets/images/boxes/Box3_optimized.png',
      contenido: {
        es: `🥑 **All greenxclusive** (2 semanas)\n\n📦 Contenido referencia:\n2 ajos, 6 cebollas, 2 ajíes, 8 papas/batatas, 1 brócoli grande, 1 coliflor mediana, 8 tomates, 2 lechugas, 1 repollo entero, apio, 2 plátanos grandes, 10 guineos verdes, 4 mangos, 2 piñas, 10 limones, 5 zanahorias, 4 pepinos, 4 berenjenas + sorpresas (perejil, cilantro, romero, orégano, canela, etc.)`,
        en: `🥑 **All greenxclusive** (2 weeks)\n\n📦 Reference content:\n2 garlic, 6 onions, 2 peppers, 8 potatoes/sweet potatoes, 1 large broccoli, 1 medium cauliflower, 8 tomatoes, 2 lettuces, 1 whole cabbage, celery, 2 large plantains, 10 green bananas, 4 mangos, 2 pineapples, 10 lemons, 5 carrots, 4 cucumbers, 4 eggplants + surprises (parsley, cilantro, rosemary, oregano, cinnamon, etc.)`
      }
    }
  },

  // ====== PRODUCTOS ELABORADOS ======
  productosElaborados: {
    babaGanoush: {
      id: 'babaGanoush',
      nombre: {
        es: 'Baba Ganoush',
        en: 'Baba Ganoush'
      },
      precio: 500,
      descripcion: {
        es: 'Porción · 16 oz / 1 lb',
        en: 'Portion · 16 oz / 1 lb'
      },
      imagen: 'assets/images/products/Baba Ganoush.jpg',
      categoria: 'elaborados'
    },
    hummus: {
      id: 'hummus',
      nombre: {
        es: 'Hummus',
        en: 'Hummus'
      },
      precio: 500,
      descripcion: {
        es: 'Porción · 16 oz / 1 lb',
        en: 'Portion · 16 oz / 1 lb'
      },
      imagen: 'assets/images/products/Hummus.jpg',
      categoria: 'elaborados'
    },
    guacamole: {
      id: 'guacamole',
      nombre: {
        es: 'Guacamole',
        en: 'Guacamole'
      },
      precio: 500,
      descripcion: {
        es: 'Porción · 16 oz / 1 lb',
        en: 'Portion · 16 oz / 1 lb'
      },
      imagen: 'assets/images/products/Guacamole.jpg',
      categoria: 'elaborados'
    },
    chimichurri: {
      id: 'chimichurri',
      nombre: {
        es: 'Chimi Churri',
        en: 'Chimichurri'
      },
      precio: 350,
      descripcion: {
        es: 'Porción · 9.5 oz / 270 g',
        en: 'Portion · 9.5 oz / 270 g'
      },
      imagen: 'assets/images/products/Chimichurri.jpg',
      categoria: 'elaborados'
    }
  },

  // ====== JUGOS NATURALES ======
  jugos: {
    pepinada: {
      id: 'pepinada',
      nombre: {
        es: 'Pepinada',
        en: 'Pepinada'
      },
      precio: 175,
      descripcion: {
        es: 'Pepino, apio y limón · 750 ml',
        en: 'Cucumber, celery and lemon · 750 ml'
      },
      imagen: 'assets/images/products/MuckUpBotellaPepinada.png',
      categoria: 'jugos'
    },
    tropicalote: {
      id: 'tropicalote',
      nombre: {
        es: 'Tropicalote',
        en: 'Tropicalote'
      },
      precio: 175,
      descripcion: {
        es: 'Piña, fresas y un toque de ají morrón · 750 ml',
        en: 'Pineapple, strawberries and a touch of bell pepper · 750 ml'
      },
      imagen: 'assets/images/products/MockUpTropicalote.png',
      categoria: 'jugos'
    },
    rosaMaravillosa: {
      id: 'rosaMaravillosa',
      nombre: {
        es: 'Rosa Maravillosa',
        en: 'Wonderful Rose'
      },
      precio: 175,
      descripcion: {
        es: 'Rosa de jamaica, canela, piña y esencia de vainilla · 750 ml',
        en: 'Hibiscus, cinnamon, pineapple and vanilla essence · 750 ml'
      },
      imagen: 'assets/images/products/MockUpRosa.png',
      categoria: 'jugos'
    },
    chinaChinola: {
      id: 'chinaChinola',
      nombre: {
        es: 'China Chinola',
        en: 'China Chinola'
      },
      precio: 175,
      descripcion: {
        es: 'Naranja (china), chinola (maracuyá) y un toque de jengibre · 750 ml',
        en: 'Orange, passion fruit and a touch of ginger · 750 ml'
      },
      imagen: 'assets/images/products/MockUpChinaChinola.png',
      categoria: 'jugos'
    },
    melomania: {
      id: 'melomania',
      nombre: {
        es: 'Melomania',
        en: 'Melon Mania'
      },
      precio: 250,
      descripcion: {
        es: 'Melón y pepino · 750 ml',
        en: 'Cantaloupe and cucumber · 750 ml'
      },
      imagen: 'assets/images/products/MockUpMelomania.png',
      categoria: 'jugos'
    },
    sandiaMania: {
      id: 'sandiaMania',
      nombre: {
        es: 'Sandia mania',
        en: 'Watermelon Mania'
      },
      precio: 250,
      descripcion: {
        es: 'Sandía y manzana · 750 ml',
        en: 'Watermelon and apple · 750 ml'
      },
      imagen: 'assets/images/products/MoCkUpSandiamania.png',
      categoria: 'jugos'
    }
  },

  // ====== PRODUCTOS DE CAMPO ======
  productosCampo: {
    huevosBlancos: {
      id: 'huevosBlancos',
      nombre: {
        es: 'Huevos Blancos',
        en: 'White Eggs'
      },
      precio: 150,
      descripcion: {
        es: 'Docena (12u) · 1.5 lb (680 g)',
        en: 'Dozen (12 units) · 1.5 lb (680 g)'
      },
      imagen: 'assets/images/products/Huevos blancos.jpg',
      categoria: 'campo'
    },
    huevosColor: {
      id: 'huevosColor',
      nombre: {
        es: 'Huevos de color',
        en: 'Colored Eggs'
      },
      precio: 190,
      descripcion: {
        es: 'Docena (12u) · 1.5 lb (680 g)',
        en: 'Dozen (12 units) · 1.5 lb (680 g)'
      },
      imagen: 'assets/images/products/Huevos marrones.jpg',
      categoria: 'campo'
    },
    huevosCampo: {
      id: 'huevosCampo',
      nombre: {
        es: 'Huevos de campo orgánicos',
        en: 'Organic Free-range Eggs'
      },
      precio: 380,
      descripcion: {
        es: 'Docena (12u) · 1.5 lb (680 g)',
        en: 'Dozen (12 units) · 1.5 lb (680 g)'
      },
      imagen: 'assets/images/products/Huevos de campo.jpg',
      categoria: 'campo'
    },
    mielPura: {
      id: 'mielPura',
      nombre: {
        es: 'Miel pura de abejas',
        en: 'Pure Honey'
      },
      precio: 250,
      descripcion: {
        es: 'Porción · 6.5 oz / 184 g',
        en: 'Portion · 6.5 oz / 184 g'
      },
      imagen: 'assets/images/products/Miel de abejas.jpg',
      categoria: 'campo'
    },
    mielConPanal: {
      id: 'mielConPanal',
      nombre: {
        es: 'Miel de abejas orgánica con panal',
        en: 'Organic Honey with Comb'
      },
      precio: 500,
      descripcion: {
        es: 'Porción · 12 oz',
        en: 'Portion · 12 oz'
      },
      imagen: 'assets/images/products/Miel-con-panal_optimized.jpg',
      categoria: 'campo'
    }
  },

  // ====== OTROS PRODUCTOS ======
  otros: {
    aceiteOlivaAjo: {
      id: 'aceiteOlivaAjo',
      nombre: {
        es: 'Aceite de oliva sabor ajo',
        en: 'Garlic Flavored Olive Oil'
      },
      precio: 390,
      descripcion: {
        es: 'Unidad · 400 cc / 400 g',
        en: 'Unit · 400 cc / 400 g'
      },
      imagen: 'assets/images/products/Aceite de oliva.jpg',
      categoria: 'otros'
    },
    aceiteOliva3L: {
      id: 'aceiteOliva3L',
      nombre: {
        es: 'Aceite de oliva extra virgen importado',
        en: 'Imported Extra Virgin Olive Oil'
      },
      precio: 2900,
      descripcion: {
        es: 'Botella 3 litros · 3 L',
        en: '3-liter bottle · 3 L'
      },
      imagen: 'assets/images/products/Aceite de oliva 3litros.jpg',
      categoria: 'otros'
    },
    quinoa: {
      id: 'quinoa',
      nombre: {
        es: 'Quinoa',
        en: 'Quinoa'
      },
      precio: 450,
      descripcion: {
        es: 'Porción · 400 g',
        en: 'Portion · 400 g'
      },
      imagen: 'assets/images/products/Quinoa.jpg',
      categoria: 'otros'
    },
    arrozBlanco: {
      id: 'arrozBlanco',
      nombre: {
        es: 'Arroz blanco',
        en: 'White Rice'
      },
      precio: 125,
      descripcion: {
        es: 'Porción · 400 g',
        en: 'Portion · 400 g'
      },
      imagen: 'assets/images/products/Arroz blanco.jpg',
      categoria: 'otros'
    },
    arrozIntegral: {
      id: 'arrozIntegral',
      nombre: {
        es: 'Arroz integral',
        en: 'Brown Rice'
      },
      precio: 125,
      descripcion: {
        es: 'Porción · 400 g',
        en: 'Portion · 400 g'
      },
      imagen: 'assets/images/products/Arroz integral.jpg',
      categoria: 'otros'
    },
    lentejas: {
      id: 'lentejas',
      nombre: {
        es: 'Lentejas',
        en: 'Lentils'
      },
      precio: 175,
      descripcion: {
        es: 'Porción · 400 g',
        en: 'Portion · 400 g'
      },
      imagen: 'assets/images/products/Lentejas.jpg',
      categoria: 'otros'
    },
    habichuelasRojas: {
      id: 'habichuelasRojas',
      nombre: {
        es: 'Habichuelas rojas',
        en: 'Red Beans'
      },
      precio: 150,
      descripcion: {
        es: 'Porción · 400 g',
        en: 'Portion · 400 g'
      },
      imagen: 'assets/images/products/Frijoles rojos.jpg',
      categoria: 'otros'
    },
    habichuelasNegras: {
      id: 'habichuelasNegras',
      nombre: {
        es: 'Habichuelas negras',
        en: 'Black Beans'
      },
      precio: 150,
      descripcion: {
        es: 'Porción · 400 g',
        en: 'Portion · 400 g'
      },
      imagen: 'assets/images/products/Frijoles negros.jpg',
      categoria: 'otros'
    },
    habichuelasBlancas: {
      id: 'habichuelasBlancas',
      nombre: {
        es: 'Habichuelas blancas',
        en: 'White Beans'
      },
      precio: 150,
      descripcion: {
        es: 'Libra · 400 g',
        en: 'Pound · 400 g'
      },
      imagen: 'assets/images/products/Frijoles blancos.jpg',
      categoria: 'otros'
    }
  },

  // ====== FRUTAS (A LA CARTA) ======
  frutas: {
    aguacate: {
      id: 'aguacate',
      nombre: {
        es: 'Aguacates',
        en: 'Avocados'
      },
      precio: 100,
      imagen: 'assets/images/products/Aguacate.jpg',
      categoria: 'frutas'
    },
    mandarinas: {
      id: 'mandarinas',
      nombre: {
        es: 'Mandarinas',
        en: 'Tangerines'
      },
      precio: 85,
      imagen: 'assets/images/products/Mandarinas.jpg',
      categoria: 'frutas'
    },
    chinola: {
      id: 'chinola',
      nombre: {
        es: 'Chinola',
        en: 'Passion Fruit'
      },
      precio: 45,
      imagen: 'assets/images/products/Chinola.jpg',
      categoria: 'frutas'
    },
    platanoMaduro: {
      id: 'platanoMaduro',
      nombre: {
        es: 'Platano maduro',
        en: 'Ripe Plantain'
      },
      precio: 60,
      imagen: 'assets/images/products/Platano maduro.jpg',
      categoria: 'frutas'
    },
    pina: {
      id: 'pina',
      nombre: {
        es: 'Piña',
        en: 'Pineapple'
      },
      precio: 120,
      imagen: 'assets/images/products/Piña.jpg',
      categoria: 'frutas'
    },
    fresas: {
      id: 'fresas',
      nombre: {
        es: 'Fresas',
        en: 'Strawberries'
      },
      precio: 250,
      imagen: 'assets/images/products/Fresas.jpg',
      categoria: 'frutas'
    },
    mango: {
      id: 'mango',
      nombre: {
        es: 'Mango',
        en: 'Mango'
      },
      precio: 75,
      imagen: 'assets/images/products/Mango.jpg',
      categoria: 'frutas'
    },
    coco: {
      id: 'coco',
      nombre: {
        es: 'Coco',
        en: 'Coconut'
      },
      precio: 120,
      imagen: 'assets/images/products/Coco.jpg',
      categoria: 'frutas'
    },
    lechosa: {
      id: 'lechosa',
      nombre: {
        es: 'Lechosa',
        en: 'Papaya'
      },
      precio: 120,
      imagen: 'assets/images/products/Lechosa.jpg',
      categoria: 'frutas'
    },
    banana: {
      id: 'banana',
      nombre: {
        es: 'Banana',
        en: 'Banana'
      },
      precio: 35,
      imagen: 'assets/images/products/Banana.jpg',
      categoria: 'frutas'
    },
    manzanas: {
      id: 'manzanas',
      nombre: {
        es: 'Manzanas',
        en: 'Apples'
      },
      precio: 110,
      imagen: 'assets/images/products/Manzanas.jpg',
      categoria: 'frutas'
    },
    sandia: {
      id: 'sandia',
      nombre: {
        es: 'Sandía',
        en: 'Watermelon'
      },
      precio: 400,
      imagen: 'assets/images/products/Sandía.jpg',
      categoria: 'frutas'
    },
    melon: {
      id: 'melon',
      nombre: {
        es: 'Melón',
        en: 'Melon'
      },
      precio: 200,
      imagen: 'assets/images/products/Melón.jpg',
      categoria: 'frutas'
    },
    carambola: {
      id: 'carambola',
      nombre: {
        es: 'Carambola',
        en: 'Star Fruit'
      },
      precio: 80,
      imagen: 'assets/images/products/Carambola.jpg',
      categoria: 'frutas'
    }
  },

  // ====== VEGETALES (A LA CARTA) ======
  vegetales: {
    papas: {
      id: 'papas',
      nombre: {
        es: 'Papas',
        en: 'Potatoes'
      },
      precio: 40,
      imagen: 'assets/images/products/Papas.jpg',
      categoria: 'vegetales'
    },
    platanoVerde: {
      id: 'platanoVerde',
      nombre: {
        es: 'Plátano verde',
        en: 'Green Plantain'
      },
      precio: 80,
      imagen: 'assets/images/products/PlatanoVerde.jpg',
      categoria: 'vegetales'
    },
    rabano: {
      id: 'rabano',
      nombre: {
        es: 'Rabano',
        en: 'Radish'
      },
      precio: 85,
      imagen: 'assets/images/products/Rabanitos.jpg',
      categoria: 'vegetales'
    },
    tomateRedondo: {
      id: 'tomateRedondo',
      nombre: {
        es: 'Tomate redondo',
        en: 'Round Tomato'
      },
      precio: 50,
      imagen: 'assets/images/products/Tomates redondos.jpg',
      categoria: 'vegetales'
    },
    batata: {
      id: 'batata',
      nombre: {
        es: 'Batata',
        en: 'Sweet Potato'
      },
      precio: 75,
      imagen: 'assets/images/products/Batata.jpg',
      categoria: 'vegetales'
    },
    name: {
      id: 'name',
      nombre: {
        es: 'Ñame',
        en: 'Yam'
      },
      precio: 100,
      imagen: 'assets/images/products/Ñame.jpg',
      categoria: 'vegetales'
    },
    cilantro: {
      id: 'cilantro',
      nombre: {
        es: 'Cilantro',
        en: 'Cilantro'
      },
      precio: 150,
      descripcion: {
        es: 'Manojo · 50 g',
        en: 'Bundle · 50 g'
      },
      imagen: 'assets/images/products/Cilantro.jpg',
      categoria: 'vegetales'
    },
    perejil: {
      id: 'perejil',
      nombre: {
        es: 'Perejil',
        en: 'Parsley'
      },
      precio: 150,
      descripcion: {
        es: 'Manojo · 50 g',
        en: 'Bundle · 50 g'
      },
      imagen: 'assets/images/products/Perejil.jpg',
      categoria: 'vegetales'
    },
    genjibre: {
      id: 'genjibre',
      nombre: {
        es: 'Genjibre',
        en: 'Ginger'
      },
      precio: 65,
      descripcion: {
        es: 'Unidad · aprox. 125 g',
        en: 'Unit · approx. 125 g'
      },
      imagen: 'assets/images/products/Genjibre.jpg',
      categoria: 'vegetales'
    },
    brocoli: {
      id: 'brocoli',
      nombre: {
        es: 'Bróccoli',
        en: 'Broccoli'
      },
      precio: 150,
      descripcion: {
        es: 'Unidad · 0.75-1 lb aprox.',
        en: 'Unit · 0.75-1 lb approx.'
      },
      imagen: 'assets/images/products/Brocoli.jpg',
      categoria: 'vegetales'
    }
  }
};

const PRODUCTOS_METADATOS = JSON.parse(`{
  "cajas": {
    "box1": {
      "precio": 650,
      "detalles": {
        "sku": "GD-CAJA-001",
        "unidadVenta": "caja",
        "pesoAproximado": "7.7 lb (3.5 kg)",
        "descripcionCorta": "Box 1 'Caribbean Fresh Pack' (3 días) frescos de alta calidad.",
        "valorNutricional": "Variado: Rica en vitaminas A, C, fibra, antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 422.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-caja-001.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 1,
        "tags": "cajas, box, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Box 1 'Caribbean Fresh Pack' (3 días)"
      }
    },
    "box2": {
      "precio": 990,
      "detalles": {
        "sku": "GD-CAJA-002",
        "unidadVenta": "caja",
        "pesoAproximado": "13.2 lb (6 kg)",
        "descripcionCorta": "Box 2 'Island Weekssential' (1 semana) frescos de alta calidad.",
        "valorNutricional": "Variado: Rica en vitaminas A, C, fibra, antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 643.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-caja-002.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 2,
        "tags": "cajas, box, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Box 2 'Island Weekssential' (1 semana)"
      }
    },
    "box3": {
      "precio": 1990,
      "detalles": {
        "sku": "GD-CAJA-003",
        "unidadVenta": "caja",
        "pesoAproximado": "26.5 lb (12 kg)",
        "descripcionCorta": "Box 3 'Allgreenxclusive' (2 semanas) frescos de alta calidad.",
        "valorNutricional": "Variado: Rica en vitaminas A, C, fibra, antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 1293.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-caja-003.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 3,
        "tags": "cajas, box, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Box 3 'Allgreenxclusive' (2 semanas)"
      }
    }
  },
  "productosElaborados": {
    "babaGanoush": {
      "precio": 500,
      "detalles": {
        "sku": "GD-CASE-004",
        "unidadVenta": "porción",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Baba Ganoush (16 oz) frescos de alta calidad.",
        "valorNutricional": "Por porción: 120 cal, 8g grasa, 10g carb, 4g proteína, fibra",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 325.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-case-004.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 4,
        "tags": "productos caseros, baba, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Baba Ganoush (16 oz)"
      }
    },
    "hummus": {
      "precio": 500,
      "detalles": {
        "sku": "GD-CASE-005",
        "unidadVenta": "porción",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Hummus (16 oz) frescos de alta calidad.",
        "valorNutricional": "Por porción: 150 cal, 10g grasa, 15g carb, 6g proteína, fibra",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 325.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-case-005.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 5,
        "tags": "productos caseros, hummus, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Hummus (16 oz)"
      }
    },
    "guacamole": {
      "precio": 500,
      "detalles": {
        "sku": "GD-CASE-006",
        "unidadVenta": "porción",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Guacamole (16 oz) frescos de alta calidad.",
        "valorNutricional": "Por porción: 180 cal, 15g grasa, 12g carb, 3g proteína, vitaminas",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 325.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año (sujeto a aguacate)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-case-006.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 6,
        "tags": "productos caseros, guacamole, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Guacamole (16 oz)"
      }
    },
    "chimichurri": {
      "precio": 350,
      "detalles": {
        "sku": "GD-CASE-007",
        "unidadVenta": "porción",
        "pesoAproximado": "270g",
        "descripcionCorta": "Chimichurri (9.5 oz) frescos de alta calidad.",
        "valorNutricional": "Por porción: 80 cal, 7g grasa, 3g carb, vitaminas A, C",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 227.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-case-007.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 7,
        "tags": "productos caseros, chimichurri, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Chimichurri (9.5 oz)"
      }
    }
  },
  "jugos": {
    "pepinada": {
      "precio": 175,
      "detalles": {
        "sku": "GD-JUGO-008",
        "unidadVenta": "porción",
        "pesoAproximado": "750 ml",
        "descripcionCorta": "Pepinada (1 porción) frescos de alta calidad.",
        "valorNutricional": "Por porción: 45 cal, 0g grasa, vitaminas C, K, antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 113.75,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": true,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-jugo-008.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 8,
        "tags": "jugos naturales, pepinada, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Pepinada (1 porción)"
      }
    },
    "tropicalote": {
      "precio": 175,
      "detalles": {
        "sku": "GD-JUGO-009",
        "unidadVenta": "porción",
        "pesoAproximado": "750 ml",
        "descripcionCorta": "Tropicalote (1 porción) frescos de alta calidad.",
        "valorNutricional": "Por porción: 120 cal, 0.5g grasa, vitaminas C, A, fibra",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 113.75,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": true,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-jugo-009.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 9,
        "tags": "jugos naturales, tropicalote, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Tropicalote (1 porción)"
      }
    },
    "rosaMaravillosa": {
      "precio": 175,
      "detalles": {
        "sku": "GD-JUGO-010",
        "unidadVenta": "porción",
        "pesoAproximado": "750 ml",
        "descripcionCorta": "Rosa Maravillosa (1 porción) frescos de alta calidad.",
        "valorNutricional": "Por porción: 90 cal, 0g grasa, vitaminas C, antocianinas",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 113.75,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": true,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-jugo-010.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 10,
        "tags": "jugos naturales, rosa, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Rosa Maravillosa (1 porción)"
      }
    },
    "chinaChinola": {
      "precio": 175,
      "detalles": {
        "sku": "GD-JUGO-011",
        "unidadVenta": "porción",
        "pesoAproximado": "750 ml",
        "descripcionCorta": "China Chinola (1 porción) frescos de alta calidad.",
        "valorNutricional": "Por porción: 110 cal, 0g grasa, vitaminas C, A, fibra",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 113.75,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": true,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-jugo-011.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 11,
        "tags": "jugos naturales, china, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "China Chinola (1 porción)"
      }
    },
    "melomania": {
      "precio": 250,
      "detalles": {
        "sku": "GD-JUGO-012",
        "unidadVenta": "porción",
        "pesoAproximado": "750 ml",
        "descripcionCorta": "Melomania (1 porción) frescos de alta calidad.",
        "valorNutricional": "Por porción: 120 cal, 0g grasa, vitaminas A, C e hidratación",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 162.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": true,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-jugo-012.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 12,
        "tags": "jugos naturales, melomania, fresco",
        "notasInternas": "Nuevo jugo premium",
        "activo": true,
        "fechaActualizacion": "2026-03-07",
        "ingredientes": "Melón y pepino"
      }
    },
    "sandiaMania": {
      "precio": 250,
      "detalles": {
        "sku": "GD-JUGO-013",
        "unidadVenta": "porción",
        "pesoAproximado": "750 ml",
        "descripcionCorta": "Sandia mania (1 porción) frescos de alta calidad.",
        "valorNutricional": "Por porción: 130 cal, 0g grasa, vitaminas A, C y antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Elaboración propia",
        "proveedorPrincipal": "Producción interna",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 162.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": true,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-jugo-013.jpg",
        "destacadoWeb": true,
        "ordenPrioridad": 13,
        "tags": "jugos naturales, sandia mania, fresco",
        "notasInternas": "Nuevo jugo premium",
        "activo": true,
        "fechaActualizacion": "2026-03-07",
        "ingredientes": "Sandía y manzana"
      }
    }
  },
  "productosCampo": {
    "huevosBlancos": {
      "precio": 150,
      "detalles": {
        "sku": "GD-GRAN-012",
        "unidadVenta": "docena",
        "pesoAproximado": "1.5 lb (680g)",
        "descripcionCorta": "Huevos Blancos (12 unidades) frescos de alta calidad.",
        "valorNutricional": "Por huevo: 70 cal, 6g proteína, 5g grasa, vitaminas B12, D",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Granja local",
        "proveedorPrincipal": "Granjas locales Juan Dolio",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 97.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": false,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-gran-012.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 12,
        "tags": "productos de granja, huevos, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Huevos Blancos (12 unidades)"
      }
    },
    "huevosColor": {
      "precio": 190,
      "detalles": {
        "sku": "GD-GRAN-013",
        "unidadVenta": "docena",
        "pesoAproximado": "1.5 lb (680g)",
        "descripcionCorta": "Huevos de color (12 unidades) frescos de alta calidad.",
        "valorNutricional": "Por huevo: 70 cal, 6g proteína, 5g grasa, vitaminas B12, D",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Granja local",
        "proveedorPrincipal": "Granjas locales Juan Dolio",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 123.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": false,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-gran-013.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 13,
        "tags": "productos de granja, huevos, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Huevos de color (12 unidades)"
      }
    },
    "huevosCampo": {
      "precio": 380,
      "detalles": {
        "sku": "GD-GRAN-014",
        "unidadVenta": "docena",
        "pesoAproximado": "1.5 lb (680g)",
        "descripcionCorta": "Huevos de campo orgánicos (12 unidades) frescos de alta calidad.",
        "valorNutricional": "Por huevo: 70 cal, 6g proteína, 5g grasa, omega-3, vitaminas",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Granja local",
        "proveedorPrincipal": "Granjas locales Juan Dolio",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 247.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": true,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": false,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-gran-014.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 14,
        "tags": "productos de granja, huevos, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Huevos de campo orgánicos (12 unidades)"
      }
    },
    "mielPura": {
      "precio": 250,
      "detalles": {
        "sku": "GD-GRAN-015",
        "unidadVenta": "porción",
        "pesoAproximado": "184g",
        "descripcionCorta": "Miel pura de abejas (6.5 oz) frescos de alta calidad.",
        "valorNutricional": "Por porción: 60 cal, 17g azúcar natural, antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Granja local",
        "proveedorPrincipal": "Granjas locales Juan Dolio",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 162.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-gran-015.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 15,
        "tags": "productos de granja, miel, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Miel pura de abejas (6.5 oz)"
      }
    },
    "mielConPanal": {
      "precio": 500,
      "detalles": {
        "sku": "GD-GRAN-016",
        "unidadVenta": "porción",
        "descripcionCorta": "Miel orgánica con panal (12 oz) frescos de alta calidad.",
        "valorNutricional": "Por porción: 120 cal, 34g azúcar natural, antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Granja local",
        "proveedorPrincipal": "Granjas locales Juan Dolio",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 325.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-gran-016.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 16,
        "tags": "productos de granja, miel, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Miel orgánica con panal (12 oz)"
      }
    }
  },
  "otros": {
    "aceiteOlivaAjo": {
      "precio": 390,
      "detalles": {
        "sku": "GD-OTRO-017",
        "unidadVenta": "unidad",
        "pesoAproximado": "400g",
        "descripcionCorta": "Aceite de oliva sabor ajo (400 cc) frescos de alta calidad.",
        "valorNutricional": "Grasas monoinsaturadas, vitamina E, antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 253.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-017.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 17,
        "tags": "otros, aceite, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Aceite de oliva sabor ajo (400 cc)"
      }
    },
    "aceiteOliva3L": {
      "precio": 2900,
      "detalles": {
        "sku": "GD-OTRO-018",
        "unidadVenta": "3 litros",
        "pesoAproximado": "3 L",
        "descripcionCorta": "Aceite de oliva extra virgen importado (3 litros) frescos de alta calidad.",
        "valorNutricional": "Grasas monoinsaturadas, vitamina E, K, antioxidantes",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Importado",
        "proveedorPrincipal": "Jumbo San Pedro",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 1885.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-018.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 18,
        "tags": "otros, aceite, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Aceite de oliva extra virgen importado (3 litros)"
      }
    },
    "quinoa": {
      "precio": 450,
      "detalles": {
        "sku": "GD-OTRO-019",
        "unidadVenta": "porción",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Quinoa (16 oz) frescos de alta calidad.",
        "valorNutricional": "Proteína completa, fibra, hierro, magnesio, vitaminas B",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 292.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año (importado)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-019.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 19,
        "tags": "otros, quinoa, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Quinoa (16 oz)"
      }
    },
    "arrozBlanco": {
      "precio": 100,
      "detalles": {
        "sku": "GD-OTRO-020",
        "unidadVenta": "porción",
        "pesoAproximado": "400g",
        "descripcionCorta": "Arroz blanco (400 gr) frescos de alta calidad.",
        "valorNutricional": "Carbohidratos, vitamina B, bajo en grasa",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 65.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-020.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 20,
        "tags": "otros, arroz, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Arroz blanco (400 gr)"
      }
    },
    "arrozIntegral": {
      "precio": 100,
      "detalles": {
        "sku": "GD-OTRO-021",
        "unidadVenta": "porción",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Arroz integral (1 libra) frescos de alta calidad.",
        "valorNutricional": "Carbohidratos, fibra, vitamina B, magnesio",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 65.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-021.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 21,
        "tags": "otros, arroz, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Arroz integral (1 libra)"
      }
    },
    "lentejas": {
      "precio": 175,
      "detalles": {
        "sku": "GD-OTRO-022",
        "unidadVenta": "unidad",
        "pesoAproximado": "400g",
        "descripcionCorta": "Lentejas (400 gr) frescos de alta calidad.",
        "valorNutricional": "Proteína, fibra, hierro, folato",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 113.75,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año (importado)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-022.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 22,
        "tags": "otros, lentejas, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Lentejas (400 gr)"
      }
    },
    "habichuelasRojas": {
      "precio": 150,
      "detalles": {
        "sku": "GD-OTRO-023",
        "unidadVenta": "libra",
        "pesoAproximado": "400g",
        "descripcionCorta": "Habichuelas rojas/negras/blancas (400 gr) frescos de alta calidad.",
        "valorNutricional": "Proteína, fibra, hierro, folato",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 65.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-023.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 23,
        "tags": "otros, habichuelas, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Habichuelas rojas/negras/blancas (400 gr)"
      }
    },
    "habichuelasNegras": {
      "precio": 150,
      "detalles": {
        "sku": "GD-OTRO-023",
        "unidadVenta": "libra",
        "pesoAproximado": "400g",
        "descripcionCorta": "Habichuelas rojas/negras/blancas (400 gr) frescos de alta calidad.",
        "valorNutricional": "Proteína, fibra, hierro, folato",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 65.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-023.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 23,
        "tags": "otros, habichuelas, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Habichuelas rojas/negras/blancas (400 gr)"
      }
    },
    "habichuelasBlancas": {
      "precio": 150,
      "detalles": {
        "sku": "GD-OTRO-023",
        "unidadVenta": "libra",
        "pesoAproximado": "400g",
        "descripcionCorta": "Habichuelas rojas/negras/blancas (400 gr) frescos de alta calidad.",
        "valorNutricional": "Proteína, fibra, hierro, folato",
        "vidaUtil": "15-30 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Según producto",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 65.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Semanal",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-otro-023.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 23,
        "tags": "otros, habichuelas, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Habichuelas rojas/negras/blancas (400 gr)"
      }
    }
  },
  "frutas": {
    "aguacate": {
      "precio": 80,
      "detalles": {
        "sku": "GD-FRUT-024",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Aguacate frescos de alta calidad.",
        "valorNutricional": "Alto en grasas saludables, vitamina E, K, potasio, fibra",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 65.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año (mejor: ago-nov)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-024.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 24,
        "tags": "frutas, aguacate, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Aguacate"
      }
    },
    "mandarinas": {
      "precio": 150,
      "detalles": {
        "sku": "GD-FRUT-025",
        "unidadVenta": "libra",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Mandarina frescos de alta calidad.",
        "valorNutricional": "Vitamina C, fibra, antioxidantes, bajo en calorías",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 25.35,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Oct-Dic (Navidad)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-025.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 25,
        "tags": "frutas, mandarina, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Mandarina"
      }
    },
    "chinola": {
      "precio": 90,
      "detalles": {
        "sku": "GD-FRUT-026",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Chinola frescos de alta calidad.",
        "valorNutricional": "Vitamina C, A, fibra, antioxidantes",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 20.15,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-026.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 26,
        "tags": "frutas, chinola, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Chinola"
      }
    },
    "platanoMaduro": {
      "precio": 85,
      "detalles": {
        "sku": "GD-FRUT-027",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Plátano maduro frescos de alta calidad.",
        "valorNutricional": "Carbohidratos, vitamina B6, potasio, fibra",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 13.65,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-027.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 27,
        "tags": "frutas, plátano, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Plátano maduro"
      }
    },
    "pina": {
      "precio": 40,
      "detalles": {
        "sku": "GD-FRUT-028",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Piña frescos de alta calidad.",
        "valorNutricional": "Vitamina C, manganeso, bromelina, antioxidantes",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 52.0,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año (picos: nov-feb, may-jul)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-028.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 28,
        "tags": "frutas, piña, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Piña"
      }
    },
    "fresas": {
      "precio": 110,
      "detalles": {
        "sku": "GD-FRUT-029",
        "unidadVenta": "paquete",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Fresas fresco de alta calidad.",
        "valorNutricional": "Vitamina C, manganeso, folato, antioxidantes",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 89.7,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Dic-Abr (zonas altas)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-029.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 29,
        "tags": "frutas, fresas, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Fresas"
      }
    },
    "mango": {
      "precio": 95,
      "detalles": {
        "sku": "GD-FRUT-030",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Mango frescos de alta calidad.",
        "valorNutricional": "Vitamina C, A, fibra, antioxidantes",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 24.7,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Mar-Ago (pico: may-jun)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-030.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 30,
        "tags": "frutas, mango, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Mango"
      }
    },
    "coco": {
      "precio": 65,
      "detalles": {
        "sku": "GD-FRUT-031",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Coco frescos de alta calidad.",
        "valorNutricional": "Grasas saludables, fibra, potasio, manganeso",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 52.65,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-031.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 31,
        "tags": "frutas, coco, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Coco"
      }
    },
    "lechosa": {
      "precio": 120,
      "detalles": {
        "sku": "GD-FRUT-032",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Lechosa frescos de alta calidad.",
        "valorNutricional": "Vitamina C, A, folato, antioxidantes",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 40.95,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-032.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 32,
        "tags": "frutas, lechosa, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Lechosa"
      }
    },
    "banana": {
      "precio": 35,
      "detalles": {
        "sku": "GD-FRUT-033",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Banana frescos de alta calidad.",
        "valorNutricional": "Carbohidratos, vitamina B6, C, potasio",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 6.5,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-033.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 33,
        "tags": "frutas, banana, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Banana"
      }
    },
    "manzanas": {
      "precio": 75,
      "detalles": {
        "sku": "GD-FRUT-035",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Manzana frescos de alta calidad.",
        "valorNutricional": "Vitamina C, fibra, antioxidantes",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 48.75,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año (importadas)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-035.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 35,
        "tags": "frutas, manzana, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Manzana"
      }
    },
    "sandia": {
      "precio": 188,
      "detalles": {
        "sku": "GD-FRUT-036",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Sandía frescos de alta calidad.",
        "valorNutricional": "Vitamina C, A, licopeno, hidratación (92% agua)",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 122.2,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año (pico: may-ago)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-036.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 36,
        "tags": "frutas, sandía, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Sandía"
      }
    },
    "melon": {
      "precio": 125,
      "detalles": {
        "sku": "GD-FRUT-037",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Melón frescos de alta calidad.",
        "valorNutricional": "Vitamina C, A, potasio, hidratación",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 81.25,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año (pico: may-ago)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-037.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 37,
        "tags": "frutas, melón, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Melón"
      }
    },
    "carambola": {
      "precio": 31,
      "detalles": {
        "sku": "GD-FRUT-043",
        "unidadVenta": "unidad",
        "pesoAproximado": "Variable",
        "descripcionCorta": "Carambola frescos de alta calidad.",
        "valorNutricional": "Vitamina C, antioxidantes",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 20.15,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Jun-Nov",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-frut-043.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 43,
        "tags": "frutas, carambola, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Carambola"
      }
    }
  },
  "vegetales": {
    "papas": {
      "precio": 40,
      "detalles": {
        "sku": "GD-VEGE-045",
        "unidadVenta": "libra",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Papas fresco de alta calidad.",
        "valorNutricional": "Carbohidratos, vitamina C, B6, potasio",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 20.15,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Nov-May (zona montaña)",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-vege-045.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 45,
        "tags": "vegetales, papas, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Papas"
      }
    },
    "platanoVerde": {
      "precio": 80,
      "detalles": {
        "sku": "GD-VEGE-046",
        "unidadVenta": "libra",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Plátano verde frescos de alta calidad.",
        "valorNutricional": "Carbohidratos, vitamina B6, potasio, fibra",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 16.9,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-vege-046.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 46,
        "tags": "vegetales, plátano, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Plátano verde"
      }
    },
    "rabano": {
      "precio": 75,
      "detalles": {
        "sku": "GD-VEGE-052",
        "unidadVenta": "libra",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Rábano frescos de alta calidad.",
        "valorNutricional": "Vitamina C, folato, potasio, bajo en calorías",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 44.85,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-vege-052.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 52,
        "tags": "vegetales, rábano, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Rábano"
      }
    },
    "tomateRedondo": {
      "precio": 40,
      "detalles": {
        "sku": "GD-VEGE-058",
        "unidadVenta": "unidad",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Tomate redondo frescos de alta calidad.",
        "valorNutricional": "Vitamina C, licopeno, potasio",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 28.6,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-vege-058.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 58,
        "tags": "vegetales, tomate, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Tomate redondo"
      }
    },
    "batata": {
      "precio": 75,
      "detalles": {
        "sku": "GD-VEGE-064",
        "unidadVenta": "libra",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Batata frescos de alta calidad.",
        "valorNutricional": "Carbohidratos, vitamina A, fibra",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 20.15,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-vege-064.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 64,
        "tags": "vegetales, batata, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Batata"
      }
    },
    "name": {
      "precio": 19,
      "detalles": {
        "sku": "GD-VEGE-068",
        "unidadVenta": "libra",
        "pesoAproximado": "1 lb",
        "descripcionCorta": "Ñame frescos de alta calidad.",
        "valorNutricional": "Carbohidratos, vitamina C, manganeso",
        "vidaUtil": "3-5 días",
        "almacenamiento": "Refrigerado",
        "empaque": "Bolsa biodegradable retornable",
        "origen": "Local",
        "proveedorPrincipal": "Mercado Central San Pedro de Macorís",
        "proveedorAlternativo": "Por definir",
        "precioCompra": 12.35,
        "margenGanancia": 35.0,
        "frecuenciaCompra": "Diaria",
        "contactoProveedor": "Por completar",
        "organico": false,
        "temporada": "Todo el año",
        "stockDisponible": "Disponible",
        "aptoVegano": true,
        "libreGluten": true,
        "urlImagen": "https://greendolio.shop/images/gd-vege-068.jpg",
        "destacadoWeb": false,
        "ordenPrioridad": 68,
        "tags": "vegetales, ñame, fresco",
        "notasInternas": "Revisar información nutricional y completar datos",
        "activo": true,
        "fechaActualizacion": "2025-10-29",
        "ingredientes": "Ñame"
      }
    }
  }
}`);

const PRODUCTOS_ACTUALIZADOS_05NOV = {
  frutas: {
    aguacate: {
      precio: 100,
      unidadVenta: 'unidad',
      pesoAproximado: '0.66 lb (300 g aprox.)'
    },
    mandarinas: {
      precio: 85,
      unidadVenta: 'unidad',
      pesoAproximado: '0.2-0.3 lb (90-135 g)'
    },
    chinola: {
      precio: 45,
      unidadVenta: 'unidad',
      pesoAproximado: '0.15-0.25 lb (70-115 g)'
    },
    platanoMaduro: {
      precio: 60,
      unidadVenta: 'unidad',
      pesoAproximado: '0.4-0.5 lb (180-225 g)'
    },
    pina: {
      precio: 120,
      unidadVenta: 'unidad',
      pesoAproximado: '2-3 lb (0.9-1.4 kg)'
    },
    fresas: {
      precio: 250,
      unidadVenta: 'paquete 1/2 lb',
      pesoAproximado: '1/2 lb (18-20 unidades)'
    },
    mango: {
      precio: 75,
      unidadVenta: 'unidad',
      pesoAproximado: '0.5-0.8 lb (225-360 g)'
    },
    coco: {
      precio: 120,
      unidadVenta: 'unidad',
      pesoAproximado: '1.5-2.5 lb (0.7-1.1 kg)'
    },
    lechosa: {
      precio: 120,
      unidadVenta: 'unidad',
      pesoAproximado: '2-4 lb (0.9-1.8 kg)'
    },
    banana: {
      precio: 35,
      unidadVenta: 'unidad',
      pesoAproximado: '0.3-0.4 lb (135-180 g)'
    },
    manzanas: {
      precio: 110,
      unidadVenta: 'unidad',
      pesoAproximado: '0.4-0.55 lb (180-250 g)'
    },
    sandia: {
      precio: 400,
      unidadVenta: 'unidad',
      pesoAproximado: '8-12 lb (3.5-5.5 kg)'
    },
    melon: {
      precio: 200,
      unidadVenta: 'unidad',
      pesoAproximado: '2-3 lb (0.9-1.4 kg)'
    },
    carambola: {
      precio: 80,
      unidadVenta: 'unidad',
      pesoAproximado: '0.2-0.3 lb (90-135 g)'
    }
  },
  vegetales: {
    papas: {
      precio: 40,
      unidadVenta: 'unidad',
      pesoAproximado: '0.6-0.8 lb (270-360 g)'
    },
    platanoVerde: {
      precio: 80,
      unidadVenta: 'unidad',
      pesoAproximado: '0.3 lb'
    },
    rabano: {
      precio: 85,
      unidadVenta: 'unidad',
      pesoAproximado: '1 lb'
    },
    tomateRedondo: {
      precio: 50,
      unidadVenta: 'unidad',
      pesoAproximado: '1 lb'
    },
    batata: {
      precio: 75,
      unidadVenta: 'unidad',
      pesoAproximado: '0.4-0.6 lb (180-270 g)'
    },
    name: {
      precio: 100,
      unidadVenta: 'unidad',
      pesoAproximado: '1-2 lb (455-910 g)'
    },
    cilantro: {
      precio: 150,
      unidadVenta: 'manojo',
      pesoAproximado: '50 g'
    },
    perejil: {
      precio: 150,
      unidadVenta: 'manojo',
      pesoAproximado: '50 g'
    },
    genjibre: {
      precio: 65,
      unidadVenta: 'unidad',
      pesoAproximado: 'aprox. 125 g'
    },
    brocoli: {
      precio: 150,
      unidadVenta: 'unidad',
      pesoAproximado: '0.75-1 lb aprox.'
    }
  },
  otros: {
    arrozBlanco: {
      precio: 125,
      unidadVenta: 'porción',
      pesoAproximado: '400 g'
    },
    arrozIntegral: {
      precio: 125,
      unidadVenta: 'porción',
      pesoAproximado: '400 g'
    }
  }
};

const UNIDAD_DESCRIPCION_MAP = {
  caja: { es: 'Caja', en: 'Box' },
  'porción': { es: 'Porción', en: 'Portion' },
  docena: { es: 'Docena (12u)', en: 'Dozen (12 units)' },
  libra: { es: 'Libra', en: 'Pound' },
  unidad: { es: 'Unidad', en: 'Unit' },
  paquete: { es: 'Paquete', en: 'Pack' },
  '3 litros': { es: 'Botella 3 litros', en: '3-liter bottle' },
  'paquete 1/2 lb': { es: 'Paquete 1/2 lb - aprox. 18-20 unid.', en: 'Pack 1/2 lb - approx. 18-20 units' },
  manojo: { es: 'Manojo', en: 'Bundle' },
  gramos: { es: 'Gramos', en: 'Grams' },
  '30 gr': { es: 'Paquete 30 g', en: '30 g pack' },
  '15 gr': { es: 'Paquete 15 g', en: '15 g pack' }
};

function obtenerUnidadInfo(unidad) {
  if (!unidad) {
    return { es: '', en: '' };
  }
  const clave = unidad.toLowerCase();
  return UNIDAD_DESCRIPCION_MAP[clave] || {
    es: unidad.charAt(0).toUpperCase() + unidad.slice(1),
    en: unidad
  };
}

function formatearPeso(peso) {
  if (!peso) return '';
  let texto = peso.trim();
  if (/^variable$/i.test(texto)) {
    return texto;
  }
  texto = texto.replace(/(\d)([a-zA-Z])/g, '$1 $2');
  texto = texto.replace(/\baprox\b\.?/gi, 'aprox.');
  texto = texto.replace(/\s{2,}/g, ' ').trim();
  return texto;
}

function generarDescripcionProfesional(unidad, peso) {
  const unidadInfo = obtenerUnidadInfo(unidad || '');
  const pesoFmt = formatearPeso(peso || '');
  if (unidadInfo.es && pesoFmt) {
    return `${unidadInfo.es} • ${pesoFmt}`;
  }
  if (unidadInfo.es) {
    return unidadInfo.es;
  }
  return pesoFmt;
}

function actualizarDescripcionProducto(categoria, id, producto, detalles) {
  if (!detalles || !detalles.unidadVenta) return;

  const unidadInfo = obtenerUnidadInfo(detalles.unidadVenta);

  const peso = detalles.pesoAproximado || '';
  const basePeso = formatearPeso(peso);
  const pesoEs = !peso ? '' : /^variable$/i.test(peso) ? 'Peso variable' : basePeso;
  const pesoEn = !peso ? '' : /^variable$/i.test(peso) ? 'Variable weight' : basePeso;

  if (categoria === 'jugos') {
    if (!producto.descripcion) {
      producto.descripcion = { es: '', en: '' };
    }
    if (pesoEs) {
      const actualEs = producto.descripcion.es || '';
      if (!actualEs.includes(pesoEs)) {
        producto.descripcion.es = actualEs ? `${actualEs} • ${pesoEs}` : pesoEs;
      }
    }
    if (pesoEn) {
      const actualEn = producto.descripcion.en || '';
      if (!actualEn.includes(pesoEn)) {
        producto.descripcion.en = actualEn ? `${actualEn} • ${pesoEn}` : pesoEn;
      }
    }
    return;
  }

  if (categoria === 'productosElaborados') {
    const parentesis = detalles.descripcionCorta && detalles.descripcionCorta.match(/\(([^)]+)\)/);
    const extra = parentesis ? parentesis[1].trim() : '';
    const piezas = [];
    if (extra) piezas.push(extra);
    if (basePeso && (!extra || !extra.includes(basePeso))) piezas.push(basePeso);
    const info = piezas.filter(Boolean).join(' • ');
    const datos = info ? `${unidadInfo.es} • ${info}` : unidadInfo.es;
    const datosEn = info ? `${unidadInfo.en} • ${info}` : unidadInfo.en;
    producto.descripcion = {
      es: datos,
      en: datosEn
    };
    return;
  }

  const categoriasForzadas = ['frutas', 'vegetales', 'productosCampo', 'otros'];
  const descripcionActual = producto.descripcion || {};
  const esPlaceholder = !descripcionActual.es || /^\s*[-(]/.test(descripcionActual.es);
  const enPlaceholder = !descripcionActual.en || /^\s*[-(]/.test(descripcionActual.en);

  if (categoriasForzadas.includes(categoria) || esPlaceholder) {
    producto.descripcion = producto.descripcion || {};
    producto.descripcion.es = pesoEs ? `${unidadInfo.es} • ${pesoEs}` : unidadInfo.es;
  }
  if (categoriasForzadas.includes(categoria) || enPlaceholder) {
    producto.descripcion = producto.descripcion || {};
    producto.descripcion.en = pesoEn ? `${unidadInfo.en} • ${pesoEn}` : unidadInfo.en;
  }
}

function aplicarMetadatosProductos() {
  for (const [categoria, items] of Object.entries(PRODUCTOS_METADATOS)) {
    const categoriaConfig = PRODUCTOS_CONFIG[categoria];
    if (!categoriaConfig) continue;
    for (const [id, datos] of Object.entries(items)) {
      const producto = categoriaConfig[id];
      if (!producto) continue;
      if (typeof datos.precio !== 'undefined') {
        producto.precio = datos.precio;
      }
      if (datos.detalles) {
        producto.detalles = { ...datos.detalles };
      }
      actualizarDescripcionProducto(categoria, id, producto, datos.detalles);
    }
  }
}

function aplicarActualizacionesRecientes(actualizaciones) {
  for (const [categoria, items] of Object.entries(actualizaciones)) {
    const categoriaConfig = PRODUCTOS_CONFIG[categoria];
    if (!categoriaConfig) continue;
    for (const [id, datos] of Object.entries(items)) {
      const producto = categoriaConfig[id];
      if (!producto) continue;
      if (typeof datos.precio !== 'undefined') {
        producto.precio = datos.precio;
      }
      const unidad = datos.unidadVenta || datos.unidad;
      const peso = datos.pesoAproximado || datos.peso;
      producto.detalles = { ...(producto.detalles || {}) };
      if (unidad) {
        producto.detalles.unidadVenta = unidad;
      }
      if (peso) {
        producto.detalles.pesoAproximado = peso;
      }
      const descripcionProfesional = generarDescripcionProfesional(producto.detalles.unidadVenta, producto.detalles.pesoAproximado);
      if (descripcionProfesional) {
        producto.detalles.descripcionCorta = descripcionProfesional;
      }
      producto.detalles.fuentePrecios = 'Lista 05-Nov-2025';
      actualizarDescripcionProducto(categoria, id, producto, producto.detalles);
    }
  }
}

aplicarMetadatosProductos();
aplicarActualizacionesRecientes(PRODUCTOS_ACTUALIZADOS_05NOV);

// ====== FUNCIONES DE UTILIDAD ======

// Función para obtener un producto por ID
function getProducto(id) {
  for (const categoria in PRODUCTOS_CONFIG) {
    if (PRODUCTOS_CONFIG[categoria][id]) {
      return PRODUCTOS_CONFIG[categoria][id];
    }
  }
  return null;
}

// Función para obtener todos los productos de una categoría
function getProductosPorCategoria(categoria) {
  return PRODUCTOS_CONFIG[categoria] || {};
}

// Función para actualizar el precio de un producto
function actualizarPrecio(id, nuevoPrecio) {
  for (const categoria in PRODUCTOS_CONFIG) {
    if (PRODUCTOS_CONFIG[categoria][id]) {
      PRODUCTOS_CONFIG[categoria][id].precio = nuevoPrecio;
      console.log(`✅ Precio actualizado para ${id}: DOP ${nuevoPrecio}`);
      
      // EVENTO DESACTIVADO TEMPORALMENTE PARA EVITAR LOOPS
      // if (typeof window !== 'undefined') {
      //   window.dispatchEvent(new CustomEvent('productosActualizados', { 
      //     detail: { 
      //       productoId: id, 
      //       nuevoPrecio: nuevoPrecio,
      //       categoria: categoria 
      //     } 
      //   }));
      // }
      
      return true;
    }
  }
  console.error(`❌ Producto no encontrado: ${id}`);
  return false;
}

// Función para agregar un nuevo producto
function agregarProducto(categoria, id, producto) {
  if (!PRODUCTOS_CONFIG[categoria]) {
    PRODUCTOS_CONFIG[categoria] = {};
  }
  PRODUCTOS_CONFIG[categoria][id] = producto;
  console.log(`Producto agregado: ${id} en categoría ${categoria}`);
}

// Función para eliminar un producto
function eliminarProducto(id) {
  for (const categoria in PRODUCTOS_CONFIG) {
    if (PRODUCTOS_CONFIG[categoria][id]) {
      delete PRODUCTOS_CONFIG[categoria][id];
      console.log(`Producto eliminado: ${id}`);
      return true;
    }
  }
  console.error(`Producto no encontrado: ${id}`);
  return false;
}

// Función para obtener todos los productos en un formato plano
function getAllProductos() {
  const todos = [];
  for (const categoria in PRODUCTOS_CONFIG) {
    for (const id in PRODUCTOS_CONFIG[categoria]) {
      const producto = PRODUCTOS_CONFIG[categoria][id];
      producto.categoria = categoria;
      producto.id = id;
      todos.push(producto);
    }
  }
  return todos;
}

// Función para exportar la configuración actual
function exportarConfiguracion() {
  return JSON.stringify(PRODUCTOS_CONFIG, null, 2);
}

// Función para importar configuración
function importarConfiguracion(configJSON) {
  try {
    const config = JSON.parse(configJSON);
    Object.assign(PRODUCTOS_CONFIG, config);
    console.log('Configuración importada exitosamente');
    return true;
  } catch (error) {
    console.error('Error al importar configuración:', error);
    return false;
  }
}

// ====== EXPORTAR FUNCIONES ======
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PRODUCTOS_CONFIG,
    getProducto,
    getProductosPorCategoria,
    actualizarPrecio,
    agregarProducto,
    eliminarProducto,
    getAllProductos,
    exportarConfiguracion,
    importarConfiguracion
  };
} 
