(() => {
  'use strict';

  // ── Storage helpers ─────────────────────────────────────────
  const KEYS = { decks: 'pkmn_decks', matches: 'pkmn_matches', oppDecks: 'pkmn_opp_decks' };

  function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }

  function loadObj(key) {
    try { return JSON.parse(localStorage.getItem(key)) || {}; }
    catch { return {}; }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ── State ────────────────────────────────────────────────────
  let decks    = load(KEYS.decks);
  let matches  = load(KEYS.matches);
  let oppDecks = loadObj(KEYS.oppDecks); // { [deckName]: string[] }

  // Migrate old string-based decks to objects
  decks = decks.map(d => typeof d === 'string' ? { name: d, sprites: [], archetype: '' } : { archetype: '', ...d });

  // ── Stats view state ─────────────────────────────────────────
  let statsView = 'decks'; // 'decks' | 'archetypes'

  // ── Pokémon HOME sprite data (Gen 1–9 base forms + alternate forms) ───────
  const POKEMON_DATA = [{id:1,name:"Bulbasaur"},{id:2,name:"Ivysaur"},{id:3,name:"Venusaur"},{id:4,name:"Charmander"},{id:5,name:"Charmeleon"},{id:6,name:"Charizard"},{id:7,name:"Squirtle"},{id:8,name:"Wartortle"},{id:9,name:"Blastoise"},{id:10,name:"Caterpie"},{id:11,name:"Metapod"},{id:12,name:"Butterfree"},{id:13,name:"Weedle"},{id:14,name:"Kakuna"},{id:15,name:"Beedrill"},{id:16,name:"Pidgey"},{id:17,name:"Pidgeotto"},{id:18,name:"Pidgeot"},{id:19,name:"Rattata"},{id:20,name:"Raticate"},{id:21,name:"Spearow"},{id:22,name:"Fearow"},{id:23,name:"Ekans"},{id:24,name:"Arbok"},{id:25,name:"Pikachu"},{id:26,name:"Raichu"},{id:27,name:"Sandshrew"},{id:28,name:"Sandslash"},{id:29,name:"Nidoran\u2640"},{id:30,name:"Nidorina"},{id:31,name:"Nidoqueen"},{id:32,name:"Nidoran\u2642"},{id:33,name:"Nidorino"},{id:34,name:"Nidoking"},{id:35,name:"Clefairy"},{id:36,name:"Clefable"},{id:37,name:"Vulpix"},{id:38,name:"Ninetales"},{id:39,name:"Jigglypuff"},{id:40,name:"Wigglytuff"},{id:41,name:"Zubat"},{id:42,name:"Golbat"},{id:43,name:"Oddish"},{id:44,name:"Gloom"},{id:45,name:"Vileplume"},{id:46,name:"Paras"},{id:47,name:"Parasect"},{id:48,name:"Venonat"},{id:49,name:"Venomoth"},{id:50,name:"Diglett"},{id:51,name:"Dugtrio"},{id:52,name:"Meowth"},{id:53,name:"Persian"},{id:54,name:"Psyduck"},{id:55,name:"Golduck"},{id:56,name:"Mankey"},{id:57,name:"Primeape"},{id:58,name:"Growlithe"},{id:59,name:"Arcanine"},{id:60,name:"Poliwag"},{id:61,name:"Poliwhirl"},{id:62,name:"Poliwrath"},{id:63,name:"Abra"},{id:64,name:"Kadabra"},{id:65,name:"Alakazam"},{id:66,name:"Machop"},{id:67,name:"Machoke"},{id:68,name:"Machamp"},{id:69,name:"Bellsprout"},{id:70,name:"Weepinbell"},{id:71,name:"Victreebel"},{id:72,name:"Tentacool"},{id:73,name:"Tentacruel"},{id:74,name:"Geodude"},{id:75,name:"Graveler"},{id:76,name:"Golem"},{id:77,name:"Ponyta"},{id:78,name:"Rapidash"},{id:79,name:"Slowpoke"},{id:80,name:"Slowbro"},{id:81,name:"Magnemite"},{id:82,name:"Magneton"},{id:83,name:"Farfetch'd"},{id:84,name:"Doduo"},{id:85,name:"Dodrio"},{id:86,name:"Seel"},{id:87,name:"Dewgong"},{id:88,name:"Grimer"},{id:89,name:"Muk"},{id:90,name:"Shellder"},{id:91,name:"Cloyster"},{id:92,name:"Gastly"},{id:93,name:"Haunter"},{id:94,name:"Gengar"},{id:95,name:"Onix"},{id:96,name:"Drowzee"},{id:97,name:"Hypno"},{id:98,name:"Krabby"},{id:99,name:"Kingler"},{id:100,name:"Voltorb"},{id:101,name:"Electrode"},{id:102,name:"Exeggcute"},{id:103,name:"Exeggutor"},{id:104,name:"Cubone"},{id:105,name:"Marowak"},{id:106,name:"Hitmonlee"},{id:107,name:"Hitmonchan"},{id:108,name:"Lickitung"},{id:109,name:"Koffing"},{id:110,name:"Weezing"},{id:111,name:"Rhyhorn"},{id:112,name:"Rhydon"},{id:113,name:"Chansey"},{id:114,name:"Tangela"},{id:115,name:"Kangaskhan"},{id:116,name:"Horsea"},{id:117,name:"Seadra"},{id:118,name:"Goldeen"},{id:119,name:"Seaking"},{id:120,name:"Staryu"},{id:121,name:"Starmie"},{id:122,name:"Mr. Mime"},{id:123,name:"Scyther"},{id:124,name:"Jynx"},{id:125,name:"Electabuzz"},{id:126,name:"Magmar"},{id:127,name:"Pinsir"},{id:128,name:"Tauros"},{id:129,name:"Magikarp"},{id:130,name:"Gyarados"},{id:131,name:"Lapras"},{id:132,name:"Ditto"},{id:133,name:"Eevee"},{id:134,name:"Vaporeon"},{id:135,name:"Jolteon"},{id:136,name:"Flareon"},{id:137,name:"Porygon"},{id:138,name:"Omanyte"},{id:139,name:"Omastar"},{id:140,name:"Kabuto"},{id:141,name:"Kabutops"},{id:142,name:"Aerodactyl"},{id:143,name:"Snorlax"},{id:144,name:"Articuno"},{id:145,name:"Zapdos"},{id:146,name:"Moltres"},{id:147,name:"Dratini"},{id:148,name:"Dragonair"},{id:149,name:"Dragonite"},{id:150,name:"Mewtwo"},{id:151,name:"Mew"},{id:152,name:"Chikorita"},{id:153,name:"Bayleef"},{id:154,name:"Meganium"},{id:155,name:"Cyndaquil"},{id:156,name:"Quilava"},{id:157,name:"Typhlosion"},{id:158,name:"Totodile"},{id:159,name:"Croconaw"},{id:160,name:"Feraligatr"},{id:161,name:"Sentret"},{id:162,name:"Furret"},{id:163,name:"Hoothoot"},{id:164,name:"Noctowl"},{id:165,name:"Ledyba"},{id:166,name:"Ledian"},{id:167,name:"Spinarak"},{id:168,name:"Ariados"},{id:169,name:"Crobat"},{id:170,name:"Chinchou"},{id:171,name:"Lanturn"},{id:172,name:"Pichu"},{id:173,name:"Cleffa"},{id:174,name:"Igglybuff"},{id:175,name:"Togepi"},{id:176,name:"Togetic"},{id:177,name:"Natu"},{id:178,name:"Xatu"},{id:179,name:"Mareep"},{id:180,name:"Flaaffy"},{id:181,name:"Ampharos"},{id:182,name:"Bellossom"},{id:183,name:"Marill"},{id:184,name:"Azumarill"},{id:185,name:"Sudowoodo"},{id:186,name:"Politoed"},{id:187,name:"Hoppip"},{id:188,name:"Skiploom"},{id:189,name:"Jumpluff"},{id:190,name:"Aipom"},{id:191,name:"Sunkern"},{id:192,name:"Sunflora"},{id:193,name:"Yanma"},{id:194,name:"Wooper"},{id:195,name:"Quagsire"},{id:196,name:"Espeon"},{id:197,name:"Umbreon"},{id:198,name:"Murkrow"},{id:199,name:"Slowking"},{id:200,name:"Misdreavus"},{id:201,name:"Unown"},{id:202,name:"Wobbuffet"},{id:203,name:"Girafarig"},{id:204,name:"Pineco"},{id:205,name:"Forretress"},{id:206,name:"Dunsparce"},{id:207,name:"Gligar"},{id:208,name:"Steelix"},{id:209,name:"Snubbull"},{id:210,name:"Granbull"},{id:211,name:"Qwilfish"},{id:212,name:"Scizor"},{id:213,name:"Shuckle"},{id:214,name:"Heracross"},{id:215,name:"Sneasel"},{id:216,name:"Teddiursa"},{id:217,name:"Ursaring"},{id:218,name:"Slugma"},{id:219,name:"Magcargo"},{id:220,name:"Swinub"},{id:221,name:"Piloswine"},{id:222,name:"Corsola"},{id:223,name:"Remoraid"},{id:224,name:"Octillery"},{id:225,name:"Delibird"},{id:226,name:"Mantine"},{id:227,name:"Skarmory"},{id:228,name:"Houndour"},{id:229,name:"Houndoom"},{id:230,name:"Kingdra"},{id:231,name:"Phanpy"},{id:232,name:"Donphan"},{id:233,name:"Porygon2"},{id:234,name:"Stantler"},{id:235,name:"Smeargle"},{id:236,name:"Tyrogue"},{id:237,name:"Hitmontop"},{id:238,name:"Smoochum"},{id:239,name:"Elekid"},{id:240,name:"Magby"},{id:241,name:"Miltank"},{id:242,name:"Blissey"},{id:243,name:"Raikou"},{id:244,name:"Entei"},{id:245,name:"Suicune"},{id:246,name:"Larvitar"},{id:247,name:"Pupitar"},{id:248,name:"Tyranitar"},{id:249,name:"Lugia"},{id:250,name:"Ho-Oh"},{id:251,name:"Celebi"},{id:252,name:"Treecko"},{id:253,name:"Grovyle"},{id:254,name:"Sceptile"},{id:255,name:"Torchic"},{id:256,name:"Combusken"},{id:257,name:"Blaziken"},{id:258,name:"Mudkip"},{id:259,name:"Marshtomp"},{id:260,name:"Swampert"},{id:261,name:"Poochyena"},{id:262,name:"Mightyena"},{id:263,name:"Zigzagoon"},{id:264,name:"Linoone"},{id:265,name:"Wurmple"},{id:266,name:"Silcoon"},{id:267,name:"Beautifly"},{id:268,name:"Cascoon"},{id:269,name:"Dustox"},{id:270,name:"Lotad"},{id:271,name:"Lombre"},{id:272,name:"Ludicolo"},{id:273,name:"Seedot"},{id:274,name:"Nuzleaf"},{id:275,name:"Shiftry"},{id:276,name:"Taillow"},{id:277,name:"Swellow"},{id:278,name:"Wingull"},{id:279,name:"Pelipper"},{id:280,name:"Ralts"},{id:281,name:"Kirlia"},{id:282,name:"Gardevoir"},{id:283,name:"Surskit"},{id:284,name:"Masquerain"},{id:285,name:"Shroomish"},{id:286,name:"Breloom"},{id:287,name:"Slakoth"},{id:288,name:"Vigoroth"},{id:289,name:"Slaking"},{id:290,name:"Nincada"},{id:291,name:"Ninjask"},{id:292,name:"Shedinja"},{id:293,name:"Whismur"},{id:294,name:"Loudred"},{id:295,name:"Exploud"},{id:296,name:"Makuhita"},{id:297,name:"Hariyama"},{id:298,name:"Azurill"},{id:299,name:"Nosepass"},{id:300,name:"Skitty"},{id:301,name:"Delcatty"},{id:302,name:"Sableye"},{id:303,name:"Mawile"},{id:304,name:"Aron"},{id:305,name:"Lairon"},{id:306,name:"Aggron"},{id:307,name:"Meditite"},{id:308,name:"Medicham"},{id:309,name:"Electrike"},{id:310,name:"Manectric"},{id:311,name:"Plusle"},{id:312,name:"Minun"},{id:313,name:"Volbeat"},{id:314,name:"Illumise"},{id:315,name:"Roselia"},{id:316,name:"Gulpin"},{id:317,name:"Swalot"},{id:318,name:"Carvanha"},{id:319,name:"Sharpedo"},{id:320,name:"Wailmer"},{id:321,name:"Wailord"},{id:322,name:"Numel"},{id:323,name:"Camerupt"},{id:324,name:"Torkoal"},{id:325,name:"Spoink"},{id:326,name:"Grumpig"},{id:327,name:"Spinda"},{id:328,name:"Trapinch"},{id:329,name:"Vibrava"},{id:330,name:"Flygon"},{id:331,name:"Cacnea"},{id:332,name:"Cacturne"},{id:333,name:"Swablu"},{id:334,name:"Altaria"},{id:335,name:"Zangoose"},{id:336,name:"Seviper"},{id:337,name:"Lunatone"},{id:338,name:"Solrock"},{id:339,name:"Barboach"},{id:340,name:"Whiscash"},{id:341,name:"Corphish"},{id:342,name:"Crawdaunt"},{id:343,name:"Baltoy"},{id:344,name:"Claydol"},{id:345,name:"Lileep"},{id:346,name:"Cradily"},{id:347,name:"Anorith"},{id:348,name:"Armaldo"},{id:349,name:"Feebas"},{id:350,name:"Milotic"},{id:351,name:"Castform"},{id:352,name:"Kecleon"},{id:353,name:"Shuppet"},{id:354,name:"Banette"},{id:355,name:"Duskull"},{id:356,name:"Dusclops"},{id:357,name:"Tropius"},{id:358,name:"Chimecho"},{id:359,name:"Absol"},{id:360,name:"Wynaut"},{id:361,name:"Snorunt"},{id:362,name:"Glalie"},{id:363,name:"Spheal"},{id:364,name:"Sealeo"},{id:365,name:"Walrein"},{id:366,name:"Clamperl"},{id:367,name:"Huntail"},{id:368,name:"Gorebyss"},{id:369,name:"Relicanth"},{id:370,name:"Luvdisc"},{id:371,name:"Bagon"},{id:372,name:"Shelgon"},{id:373,name:"Salamence"},{id:374,name:"Beldum"},{id:375,name:"Metang"},{id:376,name:"Metagross"},{id:377,name:"Regirock"},{id:378,name:"Regice"},{id:379,name:"Registeel"},{id:380,name:"Latias"},{id:381,name:"Latios"},{id:382,name:"Kyogre"},{id:383,name:"Groudon"},{id:384,name:"Rayquaza"},{id:385,name:"Jirachi"},{id:386,name:"Deoxys"},{id:387,name:"Turtwig"},{id:388,name:"Grotle"},{id:389,name:"Torterra"},{id:390,name:"Chimchar"},{id:391,name:"Monferno"},{id:392,name:"Infernape"},{id:393,name:"Piplup"},{id:394,name:"Prinplup"},{id:395,name:"Empoleon"},{id:396,name:"Starly"},{id:397,name:"Staravia"},{id:398,name:"Staraptor"},{id:399,name:"Bidoof"},{id:400,name:"Bibarel"},{id:401,name:"Kricketot"},{id:402,name:"Kricketune"},{id:403,name:"Shinx"},{id:404,name:"Luxio"},{id:405,name:"Luxray"},{id:406,name:"Budew"},{id:407,name:"Roserade"},{id:408,name:"Cranidos"},{id:409,name:"Rampardos"},{id:410,name:"Shieldon"},{id:411,name:"Bastiodon"},{id:412,name:"Burmy"},{id:413,name:"Wormadam"},{id:414,name:"Mothim"},{id:415,name:"Combee"},{id:416,name:"Vespiquen"},{id:417,name:"Pachirisu"},{id:418,name:"Buizel"},{id:419,name:"Floatzel"},{id:420,name:"Cherubi"},{id:421,name:"Cherrim"},{id:422,name:"Shellos"},{id:423,name:"Gastrodon"},{id:424,name:"Ambipom"},{id:425,name:"Drifloon"},{id:426,name:"Drifblim"},{id:427,name:"Buneary"},{id:428,name:"Lopunny"},{id:429,name:"Mismagius"},{id:430,name:"Honchkrow"},{id:431,name:"Glameow"},{id:432,name:"Purugly"},{id:433,name:"Chingling"},{id:434,name:"Stunky"},{id:435,name:"Skuntank"},{id:436,name:"Bronzor"},{id:437,name:"Bronzong"},{id:438,name:"Bonsly"},{id:439,name:"Mime Jr."},{id:440,name:"Happiny"},{id:441,name:"Chatot"},{id:442,name:"Spiritomb"},{id:443,name:"Gible"},{id:444,name:"Gabite"},{id:445,name:"Garchomp"},{id:446,name:"Munchlax"},{id:447,name:"Riolu"},{id:448,name:"Lucario"},{id:449,name:"Hippopotas"},{id:450,name:"Hippowdon"},{id:451,name:"Skorupi"},{id:452,name:"Drapion"},{id:453,name:"Croagunk"},{id:454,name:"Toxicroak"},{id:455,name:"Carnivine"},{id:456,name:"Finneon"},{id:457,name:"Lumineon"},{id:458,name:"Mantyke"},{id:459,name:"Snover"},{id:460,name:"Abomasnow"},{id:461,name:"Weavile"},{id:462,name:"Magnezone"},{id:463,name:"Lickilicky"},{id:464,name:"Rhyperior"},{id:465,name:"Tangrowth"},{id:466,name:"Electivire"},{id:467,name:"Magmortar"},{id:468,name:"Togekiss"},{id:469,name:"Yanmega"},{id:470,name:"Leafeon"},{id:471,name:"Glaceon"},{id:472,name:"Gliscor"},{id:473,name:"Mamoswine"},{id:474,name:"Porygon-Z"},{id:475,name:"Gallade"},{id:476,name:"Probopass"},{id:477,name:"Dusknoir"},{id:478,name:"Froslass"},{id:479,name:"Rotom"},{id:480,name:"Uxie"},{id:481,name:"Mesprit"},{id:482,name:"Azelf"},{id:483,name:"Dialga"},{id:484,name:"Palkia"},{id:485,name:"Heatran"},{id:486,name:"Regigigas"},{id:487,name:"Giratina"},{id:488,name:"Cresselia"},{id:489,name:"Phione"},{id:490,name:"Manaphy"},{id:491,name:"Darkrai"},{id:492,name:"Shaymin"},{id:493,name:"Arceus"},{id:494,name:"Victini"},{id:495,name:"Snivy"},{id:496,name:"Servine"},{id:497,name:"Serperior"},{id:498,name:"Tepig"},{id:499,name:"Pignite"},{id:500,name:"Emboar"},{id:501,name:"Oshawott"},{id:502,name:"Dewott"},{id:503,name:"Samurott"},{id:504,name:"Patrat"},{id:505,name:"Watchog"},{id:506,name:"Lillipup"},{id:507,name:"Herdier"},{id:508,name:"Stoutland"},{id:509,name:"Purrloin"},{id:510,name:"Liepard"},{id:511,name:"Pansage"},{id:512,name:"Simisage"},{id:513,name:"Pansear"},{id:514,name:"Simisear"},{id:515,name:"Panpour"},{id:516,name:"Simipour"},{id:517,name:"Munna"},{id:518,name:"Musharna"},{id:519,name:"Pidove"},{id:520,name:"Tranquill"},{id:521,name:"Unfezant"},{id:522,name:"Blitzle"},{id:523,name:"Zebstrika"},{id:524,name:"Roggenrola"},{id:525,name:"Boldore"},{id:526,name:"Gigalith"},{id:527,name:"Woobat"},{id:528,name:"Swoobat"},{id:529,name:"Drilbur"},{id:530,name:"Excadrill"},{id:531,name:"Audino"},{id:532,name:"Timburr"},{id:533,name:"Gurdurr"},{id:534,name:"Conkeldurr"},{id:535,name:"Tympole"},{id:536,name:"Palpitoad"},{id:537,name:"Seismitoad"},{id:538,name:"Throh"},{id:539,name:"Sawk"},{id:540,name:"Sewaddle"},{id:541,name:"Swadloon"},{id:542,name:"Leavanny"},{id:543,name:"Venipede"},{id:544,name:"Whirlipede"},{id:545,name:"Scolipede"},{id:546,name:"Cottonee"},{id:547,name:"Whimsicott"},{id:548,name:"Petilil"},{id:549,name:"Lilligant"},{id:550,name:"Basculin"},{id:551,name:"Sandile"},{id:552,name:"Krokorok"},{id:553,name:"Krookodile"},{id:554,name:"Darumaka"},{id:555,name:"Darmanitan"},{id:556,name:"Maractus"},{id:557,name:"Dwebble"},{id:558,name:"Crustle"},{id:559,name:"Scraggy"},{id:560,name:"Scrafty"},{id:561,name:"Sigilyph"},{id:562,name:"Yamask"},{id:563,name:"Cofagrigus"},{id:564,name:"Tirtouga"},{id:565,name:"Carracosta"},{id:566,name:"Archen"},{id:567,name:"Archeops"},{id:568,name:"Trubbish"},{id:569,name:"Garbodor"},{id:570,name:"Zorua"},{id:571,name:"Zoroark"},{id:572,name:"Minccino"},{id:573,name:"Cinccino"},{id:574,name:"Gothita"},{id:575,name:"Gothorita"},{id:576,name:"Gothitelle"},{id:577,name:"Solosis"},{id:578,name:"Duosion"},{id:579,name:"Reuniclus"},{id:580,name:"Ducklett"},{id:581,name:"Swanna"},{id:582,name:"Vanillite"},{id:583,name:"Vanillish"},{id:584,name:"Vanilluxe"},{id:585,name:"Deerling"},{id:586,name:"Sawsbuck"},{id:587,name:"Emolga"},{id:588,name:"Karrablast"},{id:589,name:"Escavalier"},{id:590,name:"Foongus"},{id:591,name:"Amoonguss"},{id:592,name:"Frillish"},{id:593,name:"Jellicent"},{id:594,name:"Alomomola"},{id:595,name:"Joltik"},{id:596,name:"Galvantula"},{id:597,name:"Ferroseed"},{id:598,name:"Ferrothorn"},{id:599,name:"Klink"},{id:600,name:"Klang"},{id:601,name:"Klinklang"},{id:602,name:"Tynamo"},{id:603,name:"Eelektrik"},{id:604,name:"Eelektross"},{id:605,name:"Elgyem"},{id:606,name:"Beheeyem"},{id:607,name:"Litwick"},{id:608,name:"Lampent"},{id:609,name:"Chandelure"},{id:610,name:"Axew"},{id:611,name:"Fraxure"},{id:612,name:"Haxorus"},{id:613,name:"Cubchoo"},{id:614,name:"Beartic"},{id:615,name:"Cryogonal"},{id:616,name:"Shelmet"},{id:617,name:"Accelgor"},{id:618,name:"Stunfisk"},{id:619,name:"Mienfoo"},{id:620,name:"Mienshao"},{id:621,name:"Druddigon"},{id:622,name:"Golett"},{id:623,name:"Golurk"},{id:624,name:"Pawniard"},{id:625,name:"Bisharp"},{id:626,name:"Bouffalant"},{id:627,name:"Rufflet"},{id:628,name:"Braviary"},{id:629,name:"Vullaby"},{id:630,name:"Mandibuzz"},{id:631,name:"Heatmor"},{id:632,name:"Durant"},{id:633,name:"Deino"},{id:634,name:"Zweilous"},{id:635,name:"Hydreigon"},{id:636,name:"Larvesta"},{id:637,name:"Volcarona"},{id:638,name:"Cobalion"},{id:639,name:"Terrakion"},{id:640,name:"Virizion"},{id:641,name:"Tornadus"},{id:642,name:"Thundurus"},{id:643,name:"Reshiram"},{id:644,name:"Zekrom"},{id:645,name:"Landorus"},{id:646,name:"Kyurem"},{id:647,name:"Keldeo"},{id:648,name:"Meloetta"},{id:649,name:"Genesect"},{id:650,name:"Chespin"},{id:651,name:"Quilladin"},{id:652,name:"Chesnaught"},{id:653,name:"Fennekin"},{id:654,name:"Braixen"},{id:655,name:"Delphox"},{id:656,name:"Froakie"},{id:657,name:"Frogadier"},{id:658,name:"Greninja"},{id:659,name:"Bunnelby"},{id:660,name:"Diggersby"},{id:661,name:"Fletchling"},{id:662,name:"Fletchinder"},{id:663,name:"Talonflame"},{id:664,name:"Scatterbug"},{id:665,name:"Spewpa"},{id:666,name:"Vivillon"},{id:667,name:"Litleo"},{id:668,name:"Pyroar"},{id:669,name:"Flab\u00e9b\u00e9"},{id:670,name:"Floette"},{id:671,name:"Florges"},{id:672,name:"Skiddo"},{id:673,name:"Gogoat"},{id:674,name:"Pancham"},{id:675,name:"Pangoro"},{id:676,name:"Furfrou"},{id:677,name:"Espurr"},{id:678,name:"Meowstic"},{id:679,name:"Honedge"},{id:680,name:"Doublade"},{id:681,name:"Aegislash"},{id:682,name:"Spritzee"},{id:683,name:"Aromatisse"},{id:684,name:"Swirlix"},{id:685,name:"Slurpuff"},{id:686,name:"Inkay"},{id:687,name:"Malamar"},{id:688,name:"Binacle"},{id:689,name:"Barbaracle"},{id:690,name:"Skrelp"},{id:691,name:"Dragalge"},{id:692,name:"Clauncher"},{id:693,name:"Clawitzer"},{id:694,name:"Helioptile"},{id:695,name:"Heliolisk"},{id:696,name:"Tyrunt"},{id:697,name:"Tyrantrum"},{id:698,name:"Amaura"},{id:699,name:"Aurorus"},{id:700,name:"Sylveon"},{id:701,name:"Hawlucha"},{id:702,name:"Dedenne"},{id:703,name:"Carbink"},{id:704,name:"Goomy"},{id:705,name:"Sliggoo"},{id:706,name:"Goodra"},{id:707,name:"Klefki"},{id:708,name:"Phantump"},{id:709,name:"Trevenant"},{id:710,name:"Pumpkaboo"},{id:711,name:"Gourgeist"},{id:712,name:"Bergmite"},{id:713,name:"Avalugg"},{id:714,name:"Noibat"},{id:715,name:"Noivern"},{id:716,name:"Xerneas"},{id:717,name:"Yveltal"},{id:718,name:"Zygarde"},{id:719,name:"Diancie"},{id:720,name:"Hoopa"},{id:721,name:"Volcanion"},{id:722,name:"Rowlet"},{id:723,name:"Dartrix"},{id:724,name:"Decidueye"},{id:725,name:"Litten"},{id:726,name:"Torracat"},{id:727,name:"Incineroar"},{id:728,name:"Popplio"},{id:729,name:"Brionne"},{id:730,name:"Primarina"},{id:731,name:"Pikipek"},{id:732,name:"Trumbeak"},{id:733,name:"Toucannon"},{id:734,name:"Yungoos"},{id:735,name:"Gumshoos"},{id:736,name:"Grubbin"},{id:737,name:"Charjabug"},{id:738,name:"Vikavolt"},{id:739,name:"Crabrawler"},{id:740,name:"Crabominable"},{id:741,name:"Oricorio"},{id:742,name:"Cutiefly"},{id:743,name:"Ribombee"},{id:744,name:"Rockruff"},{id:745,name:"Lycanroc"},{id:746,name:"Wishiwashi"},{id:747,name:"Mareanie"},{id:748,name:"Toxapex"},{id:749,name:"Mudbray"},{id:750,name:"Mudsdale"},{id:751,name:"Dewpider"},{id:752,name:"Araquanid"},{id:753,name:"Fomantis"},{id:754,name:"Lurantis"},{id:755,name:"Morelull"},{id:756,name:"Shiinotic"},{id:757,name:"Salandit"},{id:758,name:"Salazzle"},{id:759,name:"Stufful"},{id:760,name:"Bewear"},{id:761,name:"Bounsweet"},{id:762,name:"Steenee"},{id:763,name:"Tsareena"},{id:764,name:"Comfey"},{id:765,name:"Oranguru"},{id:766,name:"Passimian"},{id:767,name:"Wimpod"},{id:768,name:"Golisopod"},{id:769,name:"Sandygast"},{id:770,name:"Palossand"},{id:771,name:"Pyukumuku"},{id:772,name:"Type: Null"},{id:773,name:"Silvally"},{id:774,name:"Minior"},{id:775,name:"Komala"},{id:776,name:"Turtonator"},{id:777,name:"Togedemaru"},{id:778,name:"Mimikyu"},{id:779,name:"Bruxish"},{id:780,name:"Drampa"},{id:781,name:"Dhelmise"},{id:782,name:"Jangmo-o"},{id:783,name:"Hakamo-o"},{id:784,name:"Kommo-o"},{id:785,name:"Tapu Koko"},{id:786,name:"Tapu Lele"},{id:787,name:"Tapu Bulu"},{id:788,name:"Tapu Fini"},{id:789,name:"Cosmog"},{id:790,name:"Cosmoem"},{id:791,name:"Solgaleo"},{id:792,name:"Lunala"},{id:793,name:"Nihilego"},{id:794,name:"Buzzwole"},{id:795,name:"Pheromosa"},{id:796,name:"Xurkitree"},{id:797,name:"Celesteela"},{id:798,name:"Kartana"},{id:799,name:"Guzzlord"},{id:800,name:"Necrozma"},{id:801,name:"Magearna"},{id:802,name:"Marshadow"},{id:803,name:"Poipole"},{id:804,name:"Naganadel"},{id:805,name:"Stakataka"},{id:806,name:"Blacephalon"},{id:807,name:"Zeraora"},{id:808,name:"Meltan"},{id:809,name:"Melmetal"},{id:810,name:"Grookey"},{id:811,name:"Thwackey"},{id:812,name:"Rillaboom"},{id:813,name:"Scorbunny"},{id:814,name:"Raboot"},{id:815,name:"Cinderace"},{id:816,name:"Sobble"},{id:817,name:"Drizzile"},{id:818,name:"Inteleon"},{id:819,name:"Skwovet"},{id:820,name:"Greedent"},{id:821,name:"Rookidee"},{id:822,name:"Corvisquire"},{id:823,name:"Corviknight"},{id:824,name:"Blipbug"},{id:825,name:"Dottler"},{id:826,name:"Orbeetle"},{id:827,name:"Nickit"},{id:828,name:"Thievul"},{id:829,name:"Gossifleur"},{id:830,name:"Eldegoss"},{id:831,name:"Wooloo"},{id:832,name:"Dubwool"},{id:833,name:"Chewtle"},{id:834,name:"Drednaw"},{id:835,name:"Yamper"},{id:836,name:"Boltund"},{id:837,name:"Rolycoly"},{id:838,name:"Carkol"},{id:839,name:"Coalossal"},{id:840,name:"Applin"},{id:841,name:"Flapple"},{id:842,name:"Appletun"},{id:843,name:"Silicobra"},{id:844,name:"Sandaconda"},{id:845,name:"Cramorant"},{id:846,name:"Arrokuda"},{id:847,name:"Barraskewda"},{id:848,name:"Toxel"},{id:849,name:"Toxtricity"},{id:850,name:"Sizzlipede"},{id:851,name:"Centiskorch"},{id:852,name:"Clobbopus"},{id:853,name:"Grapploct"},{id:854,name:"Sinistea"},{id:855,name:"Polteageist"},{id:856,name:"Hatenna"},{id:857,name:"Hattrem"},{id:858,name:"Hatterene"},{id:859,name:"Impidimp"},{id:860,name:"Morgrem"},{id:861,name:"Grimmsnarl"},{id:862,name:"Obstagoon"},{id:863,name:"Perrserker"},{id:864,name:"Cursola"},{id:865,name:"Sirfetch'd"},{id:866,name:"Mr. Rime"},{id:867,name:"Runerigus"},{id:868,name:"Milcery"},{id:869,name:"Alcremie"},{id:870,name:"Falinks"},{id:871,name:"Pincurchin"},{id:872,name:"Snom"},{id:873,name:"Frosmoth"},{id:874,name:"Stonjourner"},{id:875,name:"Eiscue"},{id:876,name:"Indeedee"},{id:877,name:"Morpeko"},{id:878,name:"Cufant"},{id:879,name:"Copperajah"},{id:880,name:"Dracozolt"},{id:881,name:"Arctozolt"},{id:882,name:"Dracovish"},{id:883,name:"Arctovish"},{id:884,name:"Duraludon"},{id:885,name:"Dreepy"},{id:886,name:"Drakloak"},{id:887,name:"Dragapult"},{id:888,name:"Zacian"},{id:889,name:"Zamazenta"},{id:890,name:"Eternatus"},{id:891,name:"Kubfu"},{id:892,name:"Urshifu"},{id:893,name:"Zarude"},{id:894,name:"Regieleki"},{id:895,name:"Regidrago"},{id:896,name:"Glastrier"},{id:897,name:"Spectrier"},{id:898,name:"Calyrex"},{id:899,name:"Wyrdeer"},{id:900,name:"Kleavor"},{id:901,name:"Ursaluna"},{id:902,name:"Basculegion"},{id:903,name:"Sneasler"},{id:904,name:"Overqwil"},{id:905,name:"Enamorus"},{id:906,name:"Sprigatito"},{id:907,name:"Floragato"},{id:908,name:"Meowscarada"},{id:909,name:"Fuecoco"},{id:910,name:"Crocalor"},{id:911,name:"Skeledirge"},{id:912,name:"Quaxly"},{id:913,name:"Quaxwell"},{id:914,name:"Quaquaval"},{id:915,name:"Lechonk"},{id:916,name:"Oinkologne"},{id:917,name:"Tarountula"},{id:918,name:"Spidops"},{id:919,name:"Nymble"},{id:920,name:"Lokix"},{id:921,name:"Pawmi"},{id:922,name:"Pawmo"},{id:923,name:"Pawmot"},{id:924,name:"Tandemaus"},{id:925,name:"Maushold"},{id:926,name:"Fidough"},{id:927,name:"Dachsbun"},{id:928,name:"Smoliv"},{id:929,name:"Dolliv"},{id:930,name:"Arboliva"},{id:931,name:"Squawkabilly"},{id:932,name:"Nacli"},{id:933,name:"Naclstack"},{id:934,name:"Garganacl"},{id:935,name:"Charcadet"},{id:936,name:"Armarouge"},{id:937,name:"Ceruledge"},{id:938,name:"Tadbulb"},{id:939,name:"Bellibolt"},{id:940,name:"Wattrel"},{id:941,name:"Kilowattrel"},{id:942,name:"Maschiff"},{id:943,name:"Mabosstiff"},{id:944,name:"Shroodle"},{id:945,name:"Grafaiai"},{id:946,name:"Bramblin"},{id:947,name:"Brambleghast"},{id:948,name:"Toedscool"},{id:949,name:"Toedscruel"},{id:950,name:"Klawf"},{id:951,name:"Capsakid"},{id:952,name:"Scovillain"},{id:953,name:"Rellor"},{id:954,name:"Rabsca"},{id:955,name:"Flittle"},{id:956,name:"Espathra"},{id:957,name:"Tinkatink"},{id:958,name:"Tinkatuff"},{id:959,name:"Tinkaton"},{id:960,name:"Wiglett"},{id:961,name:"Wugtrio"},{id:962,name:"Bombirdier"},{id:963,name:"Finizen"},{id:964,name:"Palafin"},{id:965,name:"Varoom"},{id:966,name:"Revavroom"},{id:967,name:"Cyclizar"},{id:968,name:"Orthworm"},{id:969,name:"Glimmet"},{id:970,name:"Glimmora"},{id:971,name:"Greavard"},{id:972,name:"Houndstone"},{id:973,name:"Flamigo"},{id:974,name:"Cetoddle"},{id:975,name:"Cetitan"},{id:976,name:"Veluza"},{id:977,name:"Dondozo"},{id:978,name:"Tatsugiri"},{id:979,name:"Annihilape"},{id:980,name:"Clodsire"},{id:981,name:"Farigiraf"},{id:982,name:"Dudunsparce"},{id:983,name:"Kingambit"},{id:984,name:"Great Tusk"},{id:985,name:"Scream Tail"},{id:986,name:"Brute Bonnet"},{id:987,name:"Flutter Mane"},{id:988,name:"Slither Wing"},{id:989,name:"Sandy Shocks"},{id:990,name:"Iron Treads"},{id:991,name:"Iron Bundle"},{id:992,name:"Iron Hands"},{id:993,name:"Iron Jugulis"},{id:994,name:"Iron Moth"},{id:995,name:"Iron Thorns"},{id:996,name:"Frigibax"},{id:997,name:"Arctibax"},{id:998,name:"Baxcalibur"},{id:999,name:"Gimmighoul"},{id:1000,name:"Gholdengo"},{id:1001,name:"Wo-Chien"},{id:1002,name:"Chien-Pao"},{id:1003,name:"Ting-Lu"},{id:1004,name:"Chi-Yu"},{id:1005,name:"Roaring Moon"},{id:1006,name:"Iron Valiant"},{id:1007,name:"Koraidon"},{id:1008,name:"Miraidon"},{id:1009,name:"Walking Wake"},{id:1010,name:"Iron Leaves"},{id:1011,name:"Dipplin"},{id:1012,name:"Poltchageist"},{id:1013,name:"Sinistcha"},{id:1014,name:"Okidogi"},{id:1015,name:"Munkidori"},{id:1016,name:"Fezandipiti"},{id:1017,name:"Ogerpon"},{id:1018,name:"Archaludon"},{id:1019,name:"Hydrapple"},{id:1020,name:"Gouging Fire"},{id:1021,name:"Raging Bolt"},{id:1022,name:"Iron Boulder"},{id:1023,name:"Iron Crown"},{id:1024,name:"Terapagos"},{id:1025,name:"Pecharunt"},{id:10001,name:"Deoxys Attack"},{id:10002,name:"Deoxys Defense"},{id:10003,name:"Deoxys Speed"},{id:10004,name:"Wormadam Sandy"},{id:10005,name:"Wormadam Trash"},{id:10006,name:"Shaymin Sky"},{id:10007,name:"Giratina Origin"},{id:10008,name:"Rotom Heat"},{id:10009,name:"Rotom Wash"},{id:10010,name:"Rotom Frost"},{id:10011,name:"Rotom Fan"},{id:10012,name:"Rotom Mow"},{id:10013,name:"Castform Sunny"},{id:10014,name:"Castform Rainy"},{id:10015,name:"Castform Snowy"},{id:10016,name:"Basculin Blue Striped"},{id:10017,name:"Darmanitan Zen"},{id:10018,name:"Meloetta Pirouette"},{id:10019,name:"Tornadus Therian"},{id:10020,name:"Thundurus Therian"},{id:10021,name:"Landorus Therian"},{id:10022,name:"Kyurem Black"},{id:10023,name:"Kyurem White"},{id:10024,name:"Keldeo Resolute"},{id:10025,name:"Meowstic Female"},{id:10026,name:"Aegislash Blade"},{id:10027,name:"Pumpkaboo Small"},{id:10028,name:"Pumpkaboo Large"},{id:10029,name:"Pumpkaboo Super"},{id:10030,name:"Gourgeist Small"},{id:10031,name:"Gourgeist Large"},{id:10032,name:"Gourgeist Super"},{id:10033,name:"Mega Venusaur"},{id:10034,name:"Mega Charizard X"},{id:10035,name:"Mega Charizard Y"},{id:10036,name:"Mega Blastoise"},{id:10037,name:"Mega Alakazam"},{id:10038,name:"Mega Gengar"},{id:10039,name:"Mega Kangaskhan"},{id:10040,name:"Mega Pinsir"},{id:10041,name:"Mega Gyarados"},{id:10042,name:"Mega Aerodactyl"},{id:10043,name:"Mega Mewtwo X"},{id:10044,name:"Mega Mewtwo Y"},{id:10045,name:"Mega Ampharos"},{id:10046,name:"Mega Scizor"},{id:10047,name:"Mega Heracross"},{id:10048,name:"Mega Houndoom"},{id:10049,name:"Mega Tyranitar"},{id:10050,name:"Mega Blaziken"},{id:10051,name:"Mega Gardevoir"},{id:10052,name:"Mega Mawile"},{id:10053,name:"Mega Aggron"},{id:10054,name:"Mega Medicham"},{id:10055,name:"Mega Manectric"},{id:10056,name:"Mega Banette"},{id:10057,name:"Mega Absol"},{id:10058,name:"Mega Garchomp"},{id:10059,name:"Mega Lucario"},{id:10060,name:"Mega Abomasnow"},{id:10061,name:"Floette Eternal"},{id:10062,name:"Mega Latias"},{id:10063,name:"Mega Latios"},{id:10064,name:"Mega Swampert"},{id:10065,name:"Mega Sceptile"},{id:10066,name:"Mega Sableye"},{id:10067,name:"Mega Altaria"},{id:10068,name:"Mega Gallade"},{id:10069,name:"Mega Audino"},{id:10070,name:"Mega Sharpedo"},{id:10071,name:"Mega Slowbro"},{id:10072,name:"Mega Steelix"},{id:10073,name:"Mega Pidgeot"},{id:10074,name:"Mega Glalie"},{id:10075,name:"Mega Diancie"},{id:10076,name:"Mega Metagross"},{id:10077,name:"Primal Kyogre"},{id:10078,name:"Primal Groudon"},{id:10079,name:"Mega Rayquaza"},{id:10086,name:"Hoopa Unbound"},{id:10087,name:"Mega Camerupt"},{id:10088,name:"Mega Lopunny"},{id:10089,name:"Mega Salamence"},{id:10090,name:"Mega Beedrill"},{id:10091,name:"Alolan Rattata"},{id:10092,name:"Alolan Raticate"},{id:10093,name:"Alolan Raticate Totem"},{id:10094,name:"Pikachu Original Cap"},{id:10095,name:"Pikachu Hoenn Cap"},{id:10096,name:"Pikachu Sinnoh Cap"},{id:10097,name:"Pikachu Unova Cap"},{id:10098,name:"Pikachu Kalos Cap"},{id:10099,name:"Alolan Pikachu Cap"},{id:10100,name:"Alolan Raichu"},{id:10101,name:"Alolan Sandshrew"},{id:10102,name:"Alolan Sandslash"},{id:10103,name:"Alolan Vulpix"},{id:10104,name:"Alolan Ninetales"},{id:10105,name:"Alolan Diglett"},{id:10106,name:"Alolan Dugtrio"},{id:10107,name:"Alolan Meowth"},{id:10108,name:"Alolan Persian"},{id:10109,name:"Alolan Geodude"},{id:10110,name:"Alolan Graveler"},{id:10111,name:"Alolan Golem"},{id:10112,name:"Alolan Grimer"},{id:10113,name:"Alolan Muk"},{id:10114,name:"Alolan Exeggutor"},{id:10115,name:"Alolan Marowak"},{id:10116,name:"Greninja Battle Bond"},{id:10117,name:"Greninja Ash"},{id:10118,name:"Zygarde 10 Power Construct"},{id:10119,name:"Zygarde 50 Power Construct"},{id:10120,name:"Zygarde Complete"},{id:10121,name:"Gumshoos Totem"},{id:10122,name:"Vikavolt Totem"},{id:10123,name:"Oricorio Pom Pom"},{id:10124,name:"Oricorio Pau"},{id:10125,name:"Oricorio Sensu"},{id:10126,name:"Lycanroc Midnight"},{id:10127,name:"Wishiwashi School"},{id:10128,name:"Lurantis Totem"},{id:10129,name:"Salazzle Totem"},{id:10130,name:"Minior Orange Meteor"},{id:10131,name:"Minior Yellow Meteor"},{id:10132,name:"Minior Green Meteor"},{id:10133,name:"Minior Blue Meteor"},{id:10134,name:"Minior Indigo Meteor"},{id:10135,name:"Minior Violet Meteor"},{id:10136,name:"Minior Red"},{id:10137,name:"Minior Orange"},{id:10138,name:"Minior Yellow"},{id:10139,name:"Minior Green"},{id:10140,name:"Minior Blue"},{id:10141,name:"Minior Indigo"},{id:10142,name:"Minior Violet"},{id:10143,name:"Mimikyu Busted"},{id:10145,name:"Mimikyu Totem Busted"},{id:10146,name:"Kommo-o Totem"},{id:10147,name:"Magearna Original"},{id:10148,name:"Pikachu Partner Cap"},{id:10149,name:"Marowak Totem"},{id:10150,name:"Ribombee Totem"},{id:10151,name:"Rockruff Own Tempo"},{id:10152,name:"Lycanroc Dusk"},{id:10153,name:"Araquanid Totem"},{id:10154,name:"Togedemaru Totem"},{id:10155,name:"Necrozma Dusk"},{id:10156,name:"Necrozma Dawn"},{id:10157,name:"Necrozma Ultra"},{id:10160,name:"Pikachu World Cap"},{id:10161,name:"Galarian Meowth"},{id:10162,name:"Galarian Ponyta"},{id:10163,name:"Galarian Rapidash"},{id:10164,name:"Galarian Slowpoke"},{id:10165,name:"Galarian Slowbro"},{id:10166,name:"Galarian Farfetchd"},{id:10167,name:"Galarian Weezing"},{id:10168,name:"Galarian Mr. Mime"},{id:10169,name:"Galarian Articuno"},{id:10170,name:"Galarian Zapdos"},{id:10171,name:"Galarian Moltres"},{id:10172,name:"Galarian Slowking"},{id:10173,name:"Galarian Corsola"},{id:10174,name:"Galarian Zigzagoon"},{id:10175,name:"Galarian Linoone"},{id:10176,name:"Galarian Darumaka"},{id:10177,name:"Galarian Darmanitan Standard"},{id:10178,name:"Galarian Darmanitan Zen"},{id:10179,name:"Galarian Yamask"},{id:10180,name:"Galarian Stunfisk"},{id:10181,name:"Zygarde 10"},{id:10182,name:"Cramorant Gulping"},{id:10183,name:"Cramorant Gorging"},{id:10184,name:"Toxtricity Low Key"},{id:10185,name:"Eiscue Noice"},{id:10186,name:"Indeedee Female"},{id:10187,name:"Morpeko Hangry"},{id:10188,name:"Zacian Crowned"},{id:10189,name:"Zamazenta Crowned"},{id:10190,name:"Eternatus Eternamax"},{id:10191,name:"Urshifu Rapid Strike"},{id:10192,name:"Zarude Dada"},{id:10193,name:"Calyrex Ice"},{id:10194,name:"Calyrex Shadow"},{id:10195,name:"Gigantamax Venusaur"},{id:10196,name:"Gigantamax Charizard"},{id:10197,name:"Gigantamax Blastoise"},{id:10198,name:"Gigantamax Butterfree"},{id:10199,name:"Gigantamax Pikachu"},{id:10200,name:"Gigantamax Meowth"},{id:10201,name:"Gigantamax Machamp"},{id:10202,name:"Gigantamax Gengar"},{id:10203,name:"Gigantamax Kingler"},{id:10204,name:"Gigantamax Lapras"},{id:10205,name:"Gigantamax Eevee"},{id:10206,name:"Gigantamax Snorlax"},{id:10207,name:"Gigantamax Garbodor"},{id:10208,name:"Gigantamax Melmetal"},{id:10209,name:"Gigantamax Rillaboom"},{id:10210,name:"Gigantamax Cinderace"},{id:10211,name:"Gigantamax Inteleon"},{id:10212,name:"Gigantamax Corviknight"},{id:10213,name:"Gigantamax Orbeetle"},{id:10214,name:"Gigantamax Drednaw"},{id:10215,name:"Gigantamax Coalossal"},{id:10216,name:"Gigantamax Flapple"},{id:10217,name:"Gigantamax Appletun"},{id:10218,name:"Gigantamax Sandaconda"},{id:10219,name:"Gigantamax Toxtricity Amped"},{id:10220,name:"Gigantamax Centiskorch"},{id:10221,name:"Gigantamax Hatterene"},{id:10222,name:"Gigantamax Grimmsnarl"},{id:10223,name:"Gigantamax Alcremie"},{id:10224,name:"Gigantamax Copperajah"},{id:10225,name:"Gigantamax Duraludon"},{id:10226,name:"Gigantamax Urshifu Single Strike"},{id:10227,name:"Gigantamax Urshifu Rapid Strike"},{id:10228,name:"Gigantamax Toxtricity Low Key"},{id:10229,name:"Hisuian Growlithe"},{id:10230,name:"Hisuian Arcanine"},{id:10231,name:"Hisuian Voltorb"},{id:10232,name:"Hisuian Electrode"},{id:10233,name:"Hisuian Typhlosion"},{id:10234,name:"Hisuian Qwilfish"},{id:10235,name:"Hisuian Sneasel"},{id:10236,name:"Hisuian Samurott"},{id:10237,name:"Hisuian Lilligant"},{id:10238,name:"Hisuian Zorua"},{id:10239,name:"Hisuian Zoroark"},{id:10240,name:"Hisuian Braviary"},{id:10241,name:"Hisuian Sliggoo"},{id:10242,name:"Hisuian Goodra"},{id:10243,name:"Hisuian Avalugg"},{id:10244,name:"Hisuian Decidueye"},{id:10245,name:"Dialga Origin"},{id:10246,name:"Palkia Origin"},{id:10247,name:"Basculin White Striped"},{id:10248,name:"Basculegion Female"},{id:10249,name:"Enamorus Therian"},{id:10250,name:"Paldean Tauros Combat Breed"},{id:10251,name:"Paldean Tauros Blaze Breed"},{id:10252,name:"Paldean Tauros Aqua Breed"},{id:10253,name:"Paldean Wooper"},{id:10254,name:"Oinkologne Female"},{id:10255,name:"Dudunsparce Three Segment"},{id:10256,name:"Palafin Hero"},{id:10257,name:"Maushold Family Of Three"},{id:10258,name:"Tatsugiri Droopy"},{id:10259,name:"Tatsugiri Stretchy"}];

  // Build name lookup at runtime (lowercase name -> sprite ID)
  const POKEMON_NAME_TO_ID = Object.create(null);
  POKEMON_DATA.forEach(p => {
    const lower = p.name.toLowerCase();
    POKEMON_NAME_TO_ID[lower] = p.id;
    // Also index by slug (letters/digits only) for backward compat with stored slugs
    POKEMON_NAME_TO_ID[lower.replace(/[^a-z0-9]/g, '')] = p.id;
  });

  const HOME_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/';

  function homeUrl(id) {
    return HOME_SPRITE_BASE + id + '.png';
  }

  function spriteIdFromName(name) {
    if (!name) return null;
    const lower = String(name).toLowerCase().trim();
    return POKEMON_NAME_TO_ID[lower] || POKEMON_NAME_TO_ID[lower.replace(/[^a-z0-9]/g, '')] || null;
  }

  // ── Tab navigation ───────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      if (btn.dataset.tab === 'stats')     renderStats();
      if (btn.dataset.tab === 'history')   renderHistory();
      if (btn.dataset.tab === 'opp-decks') renderOppDecks();
    });
  });

  // ────────────────────────────────────────────────────────────
  // SPRITE PICKER
  // ────────────────────────────────────────────────────────────
  let pickerCallback = null;
  let pickerSelected = [];

  const pickerModal    = document.getElementById('sprite-picker-modal');
  const pickerSearch   = document.getElementById('sprite-search');
  const pickerGrid     = document.getElementById('sprite-picker-grid');
  const pickerCurrent  = document.getElementById('sprite-picker-current');

  function openPicker(currentSprites, cb) {
    pickerSelected = [...(currentSprites || [])];
    pickerCallback = cb;
    pickerSearch.value = '';
    renderPickerGrid('');
    renderPickerCurrent();
    pickerModal.classList.remove('hidden');
    pickerSearch.focus();
  }

  function closePicker(confirm) {
    pickerModal.classList.add('hidden');
    if (confirm && pickerCallback) pickerCallback([...pickerSelected]);
    pickerCallback = null;
  }

  function renderPickerCurrent() {
    if (!pickerSelected.length) {
      pickerCurrent.innerHTML = '<span class="picker-none">No sprites selected</span>';
      return;
    }
    pickerCurrent.innerHTML = pickerSelected.map(name => {
      const id = spriteIdFromName(name);
      const imgHtml = id ? `<img src="${homeUrl(id)}" width="32" height="32" alt="${esc(name)}" loading="lazy" />` : '';
      return `
      <span class="picker-chip">
        ${imgHtml}
        <span class="picker-chip-name">${esc(name)}</span>
        <button type="button" class="picker-chip-remove" data-name="${esc(name)}" aria-label="Remove ${esc(name)}">✕</button>
      </span>
    `;
    }).join('');
    pickerCurrent.querySelectorAll('.picker-chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        pickerSelected = pickerSelected.filter(s => s !== btn.dataset.name);
        renderPickerCurrent();
        renderPickerGrid(pickerSearch.value);
      });
    });
  }

  function renderPickerGrid(query) {
    const q = query.toLowerCase().trim();
    const filtered = q
      ? POKEMON_DATA.filter(p => p.name.toLowerCase().includes(q))
      : POKEMON_DATA;

    const visible = filtered.slice(0, 120);
    pickerGrid.innerHTML = visible.map(p => {
      const sel = pickerSelected.includes(p.name);
      return `<button type="button" class="sprite-cell${sel ? ' selected' : ''}" data-name="${esc(p.name)}" title="${esc(p.name)}">
        <img src="${homeUrl(p.id)}" width="32" height="32" alt="${esc(p.name)}" loading="lazy" />
        <span class="sprite-cell-name">${esc(p.name)}</span>
      </button>`;
    }).join('');

    if (filtered.length > 120) {
      pickerGrid.insertAdjacentHTML('beforeend', `<p class="picker-hint">Showing 120 of ${filtered.length}. Type to narrow results.</p>`);
    }

    pickerGrid.querySelectorAll('.sprite-cell').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        if (pickerSelected.includes(name)) {
          pickerSelected = pickerSelected.filter(s => s !== name);
        } else if (pickerSelected.length < 2) {
          pickerSelected.push(name);
        } else {
          pickerSelected = [pickerSelected[1], name];
        }
        renderPickerCurrent();
        renderPickerGrid(pickerSearch.value);
      });
    });
  }

  pickerSearch.addEventListener('input', () => renderPickerGrid(pickerSearch.value));
  document.getElementById('sprite-picker-close').addEventListener('click', () => closePicker(false));
  document.getElementById('sprite-picker-cancel').addEventListener('click', () => closePicker(false));
  document.getElementById('sprite-picker-confirm').addEventListener('click', () => closePicker(true));
  pickerModal.addEventListener('click', e => { if (e.target === pickerModal) closePicker(false); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !pickerModal.classList.contains('hidden')) closePicker(false);
  });

  // ────────────────────────────────────────────────────────────
  // DECK MANAGEMENT
  // ────────────────────────────────────────────────────────────
  const addDeckForm  = document.getElementById('add-deck-form');
  const newDeckInput = document.getElementById('new-deck-name');
  const deckListEl   = document.getElementById('deck-list');
  const noDecksEl    = document.getElementById('no-decks');

  // Sprite picker buttons for new deck form
  let pendingSprites = [null, null];

  function updateDeckSpritePreview(idx) {
    const name    = pendingSprites[idx];
    const preview = document.getElementById(`sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`new-sprite-${idx + 1}`);
    if (name) {
      const id = spriteIdFromName(name);
      if (id) { preview.src = homeUrl(id); preview.alt = name; }
      preview.style.display = 'inline-block';
      input.value = name;
    } else {
      preview.src = '';
      preview.style.display = 'none';
      input.value = '';
    }
  }

  document.getElementById('pick-sprite-1-btn').addEventListener('click', () => {
    openPicker(pendingSprites[0] ? [pendingSprites[0]] : [], sprites => {
      pendingSprites[0] = sprites[0] || null;
      pendingSprites[1] = sprites[1] || pendingSprites[1] || null;
      updateDeckSpritePreview(0);
      if (sprites[1] !== undefined) updateDeckSpritePreview(1);
    });
  });

  document.getElementById('pick-sprite-2-btn').addEventListener('click', () => {
    openPicker(pendingSprites[1] ? [pendingSprites[1]] : [], sprites => {
      pendingSprites[1] = sprites[0] || null;
      updateDeckSpritePreview(1);
    });
  });

  addDeckForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = newDeckInput.value.trim();
    if (!name) return;
    if (decks.some(d => d.name === name)) {
      alert(`"${name}" already exists.`);
      return;
    }
    const sprites = pendingSprites.filter(Boolean);
    const archetype = document.getElementById('new-deck-archetype').value.trim();
    decks.push({ name, sprites, archetype });
    save(KEYS.decks, decks);
    newDeckInput.value = '';
    document.getElementById('new-deck-archetype').value = '';
    pendingSprites = [null, null];
    updateDeckSpritePreview(0);
    updateDeckSpritePreview(1);
    renderDecks();
    populateDeckSelects();
  });

  function renderDecks() {
    deckListEl.innerHTML = '';
    noDecksEl.classList.toggle('hidden', decks.length > 0);

    // Group by archetype
    const grouped = {};
    decks.forEach(deck => {
      const key = deck.archetype ? deck.archetype.trim() : '';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(deck);
    });

    // Sort: named archetypes first (alphabetically), then unassigned
    const archetypeKeys = Object.keys(grouped).sort((a, b) => {
      if (a === '' && b !== '') return 1;
      if (a !== '' && b === '') return -1;
      return a.localeCompare(b);
    });

    archetypeKeys.forEach(archKey => {
      if (archetypeKeys.length > 1 || archKey !== '') {
        const header = document.createElement('li');
        header.className = 'archetype-group-header';
        header.textContent = archKey || 'Unassigned';
        deckListEl.appendChild(header);
      }

      grouped[archKey].forEach(deck => {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'deck-name-label';
        const sprites = deckSpritesHtml(deck.name);
        nameSpan.innerHTML = (sprites ? sprites + ' ' : '') + esc(deck.name);
        li.appendChild(nameSpan);

        const actions = document.createElement('div');
        actions.className = 'row-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-edit';
        editBtn.textContent = '✏ Edit';
        editBtn.addEventListener('click', () => openEditDeckModal(deck.name));
        actions.appendChild(editBtn);

        const del = document.createElement('button');
        del.className = 'btn-delete';
        del.textContent = 'Remove';
        del.addEventListener('click', () => {
          if (!confirm(`Remove "${deck.name}"? This won't delete match history for this deck.`)) return;
          decks = decks.filter(d => d.name !== deck.name);
          save(KEYS.decks, decks);
          renderDecks();
          populateDeckSelects();
        });
        actions.appendChild(del);
        li.appendChild(actions);
        deckListEl.appendChild(li);
      });
    });
  }

  // ────────────────────────────────────────────────────────────
  // POPULATE DECK SELECTS (log form + history filter)
  // ────────────────────────────────────────────────────────────
  function populateDeckSelects() {
    const myDeckSel      = document.getElementById('my-deck');
    const historyDeckSel = document.getElementById('history-deck-filter');

    const savedMyDeck      = myDeckSel.value;
    const savedHistoryDeck = historyDeckSel.value;

    myDeckSel.innerHTML = '<option value="" disabled>— select your deck —</option>';
    historyDeckSel.innerHTML = '<option value="all">All Decks</option>';

    const allDeckNames = new Set([...decks.map(d => d.name), ...matches.map(m => m.myDeck)]);
    [...allDeckNames].sort().forEach(d => {
      myDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
      historyDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
    });

    if (savedMyDeck) myDeckSel.value = savedMyDeck;
    if (savedHistoryDeck) historyDeckSel.value = savedHistoryDeck;

    updateMyDeckSpritePreview();
    populateOppDeckSelects();
  }

  function populateOppDeckSelects() {
    const names = getAllOppDeckNames();
    [
      document.getElementById('opp-deck-select'),
      document.getElementById('edit-opp-deck-select')
    ].forEach(sel => {
      if (!sel) return;
      const cur = sel.value;
      sel.innerHTML = '<option value="" disabled selected>— select opponent deck —</option>';
      names.forEach(n => {
        const opt = document.createElement('option');
        opt.value = n;
        opt.textContent = n;
        sel.appendChild(opt);
      });
      const newOpt = document.createElement('option');
      newOpt.value = '__new__';
      newOpt.textContent = '+ Add new opponent deck…';
      sel.appendChild(newOpt);
      if (cur && cur !== '') sel.value = cur;
    });

    // Also populate the edit match "your deck" select
    const editMyDeckSel = document.getElementById('edit-my-deck');
    if (editMyDeckSel) {
      const cur = editMyDeckSel.value;
      editMyDeckSel.innerHTML = '<option value="" disabled selected>— select your deck —</option>';
      const allDeckNames = new Set([...decks.map(d => d.name), ...matches.map(m => m.myDeck)]);
      [...allDeckNames].sort().forEach(d => {
        editMyDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
      });
      if (cur) editMyDeckSel.value = cur;
    }
  }

  function getAllOppDeckNames() {
    const names = new Set([...Object.keys(oppDecks), ...matches.map(m => m.oppDeck).filter(Boolean)]);
    return [...names].sort();
  }

  // ────────────────────────────────────────────────────────────
  // LOG MATCH
  // ────────────────────────────────────────────────────────────
  const logForm     = document.getElementById('log-form');
  const resultInput = document.getElementById('result-input');
  const logSuccess  = document.getElementById('log-success');

  function updateMyDeckSpritePreview() {
    const myDeckSel = document.getElementById('my-deck');
    const preview   = document.getElementById('my-deck-sprite-preview');
    if (!preview) return;
    preview.innerHTML = deckSpritesHtml(myDeckSel.value);
  }

  function updateOppDeckSpritePreview() {
    const name    = document.getElementById('opp-deck').value.trim();
    const preview = document.getElementById('opp-deck-sprite-preview');
    if (!preview) return;
    preview.innerHTML = oppSpritesHtml(name) || deckSpritesHtml(name);
  }

  document.getElementById('my-deck').addEventListener('change', updateMyDeckSpritePreview);

  // ── Shared helper: wire up opp-deck select + new-input → hidden input sync ──
  function setupOppDeckSelectHandlers(selectId, newWrapId, newInputId, hiddenId, onChangeCb) {
    document.getElementById(selectId).addEventListener('change', function () {
      const newWrap  = document.getElementById(newWrapId);
      const hiddenIn = document.getElementById(hiddenId);
      if (this.value === '__new__') {
        newWrap.classList.remove('hidden');
        hiddenIn.value = document.getElementById(newInputId).value.trim();
      } else {
        newWrap.classList.add('hidden');
        hiddenIn.value = this.value;
      }
      if (onChangeCb) onChangeCb();
    });
    document.getElementById(newInputId).addEventListener('input', function () {
      document.getElementById(hiddenId).value = this.value.trim();
      if (onChangeCb) onChangeCb();
    });
  }

  setupOppDeckSelectHandlers(
    'opp-deck-select', 'opp-new-deck-wrap', 'opp-deck-new-input', 'opp-deck',
    updateOppDeckSpritePreview
  );
  setupOppDeckSelectHandlers(
    'edit-opp-deck-select', 'edit-opp-new-deck-wrap', 'edit-opp-deck-new-input', 'edit-opp-deck',
    null
  );

  // Opponent sprite picker
  document.getElementById('pick-opp-sprite-btn').addEventListener('click', () => {
    const name = document.getElementById('opp-deck').value.trim();
    if (!name) { alert('Please select or enter the opponent\'s deck name first.'); return; }
    const current = oppDecks[name] || [];
    openPicker(current, sprites => {
      if (sprites.length) {
        oppDecks[name] = sprites;
      } else {
        delete oppDecks[name];
      }
      save(KEYS.oppDecks, oppDecks);
      updateOppDeckSpritePreview();
      populateOppDeckSelects();
    });
  });

  // Default date to today
  document.getElementById('match-date').valueAsDate = new Date();

  // Result toggle buttons
  document.querySelectorAll('#log-form .result-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#log-form .result-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      resultInput.value = btn.dataset.result;
    });
  });

  logForm.addEventListener('submit', e => {
    e.preventDefault();
    const myDeck  = document.getElementById('my-deck').value;
    const oppDeck = document.getElementById('opp-deck').value.trim();
    const result  = resultInput.value;
    const event   = document.getElementById('event-type').value;
    const date    = document.getElementById('match-date').value;
    const notes   = document.getElementById('match-notes').value.trim();

    if (!oppDeck) { alert('Please select an opponent deck or enter a new deck name.'); return; }
    if (!result) { alert('Please select Win, Loss, or Tie.'); return; }

    matches.push({ id: Date.now(), myDeck, oppDeck, result, event, date, notes });
    save(KEYS.matches, matches);

    logForm.reset();
    document.querySelectorAll('.result-btn').forEach(b => b.classList.remove('selected'));
    resultInput.value = '';
    document.getElementById('match-date').valueAsDate = new Date();
    document.getElementById('opp-deck-sprite-preview').innerHTML = '';
    document.getElementById('opp-deck').value = '';
    document.getElementById('opp-new-deck-wrap').classList.add('hidden');
    document.getElementById('opp-deck-new-input').value = '';

    logSuccess.classList.remove('hidden');
    setTimeout(() => logSuccess.classList.add('hidden'), 2500);

    populateDeckSelects();
    updateMyDeckSpritePreview();
  });

  // ────────────────────────────────────────────────────────────
  // STATS + CHARTS
  // ────────────────────────────────────────────────────────────
  const statsEventFilter = document.getElementById('stats-event-filter');
  statsEventFilter.addEventListener('change', renderStats);

  // Stats view toggle (decks / archetypes)
  document.querySelectorAll('.stats-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.stats-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statsView = btn.dataset.view;
      renderStats();
    });
  });

  // Screenshot button
  document.getElementById('screenshot-btn').addEventListener('click', async () => {
    const card = document.getElementById('stats-card');
    const btn  = document.getElementById('screenshot-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Capturing…';
    try {
      const canvas = await html2canvas(card, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false
      });
      const url = canvas.toDataURL('image/png');
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `pkmn-stats-${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Screenshot failed. Please try again.');
    } finally {
      btn.disabled = false;
      btn.textContent = '📸 Screenshot';
    }
  });

  let overallChartInst = null;
  const deckChartInsts = {};

  // ── Sprite image cache for pie chart plugin ───────────────────
  const _spriteImgCache = new Map();
  function _getCachedImg(url, onLoad) {
    if (_spriteImgCache.has(url)) return _spriteImgCache.get(url);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = onLoad;
    img.src = url;
    _spriteImgCache.set(url, img);
    return img;
  }

  // ── Custom Chart.js plugin: draw Pokémon sprites inside each deck slice ──
  const spritePiePlugin = {
    id: 'spritePie',
    afterDraw(chart) {
      const ctx       = chart.ctx;
      const meta      = chart.getDatasetMeta(0);
      const entries   = chart.data._deckEntries;
      if (!entries) return;

      entries.forEach((entry, i) => {
        const sliceWins = meta.data[2 * i];
        const sliceLoss = meta.data[2 * i + 1];
        if (!sliceWins || !sliceLoss) return;

        // Mid-angle spanning both win+loss slices for this deck
        const startAngle = sliceWins.startAngle;
        const endAngle   = sliceLoss.endAngle;
        const arcSpan    = endAngle - startAngle;
        if (arcSpan < 0.15) return; // Skip too-small slices

        const midAngle = (startAngle + endAngle) / 2;
        const r        = (sliceWins.outerRadius + sliceWins.innerRadius) / 2;
        const cx       = sliceWins.x + Math.cos(midAngle) * r;
        const cy       = sliceWins.y + Math.sin(midAngle) * r;

        const spriteUrl = entry.spriteUrl;
        if (!spriteUrl) return;

        const img = _getCachedImg(spriteUrl, () => { chart.draw(); });
        if (!img.complete || img.naturalWidth === 0) return;

        const size = Math.min(28, arcSpan * r * 0.7);
        ctx.save();
        ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
        ctx.restore();
      });
    }
  };
  Chart.register(spritePiePlugin);

  // ── Color helpers for deck slices ─────────────────────────────
  function _deckHue(idx) {
    return Math.round((idx * 137.508) % 360);
  }
  function _winColor(idx) {
    return `hsl(${_deckHue(idx)}, 68%, 48%)`;
  }
  function _lossColor(idx) {
    return `hsl(${_deckHue(idx)}, 28%, 68%)`;
  }

  // ── Render the deck-distribution pie with side legend ─────────
  function renderDeckDistributionChart(deckEntries) {
    if (overallChartInst) { overallChartInst.destroy(); overallChartInst = null; }

    const chartWrap = document.getElementById('stats-chart-wrap');
    if (!deckEntries.length) { chartWrap.classList.add('hidden'); return; }
    chartWrap.classList.remove('hidden');

    // Two slices per deck: wins + (losses+ties)
    const labels  = [];
    const data    = [];
    const bgColors = [];
    deckEntries.forEach((entry, i) => {
      const nonWins = entry.losses + entry.ties;
      labels.push(`${entry.label} – Wins`);
      labels.push(`${entry.label} – Non-wins`);
      data.push(entry.wins);
      data.push(nonWins);
      bgColors.push(_winColor(i));
      bgColors.push(_lossColor(i));
    });

    const canvas = document.getElementById('overall-pie');
    overallChartInst = new Chart(canvas, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: bgColors,
          borderWidth: 2,
          borderColor: '#ffffff'
        }],
        _deckEntries: deckEntries
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct   = total ? Math.round((ctx.parsed / total) * 100) : 0;
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        },
        animation: { duration: 400 }
      }
    });

    // Side legend: split entries left / right
    const leftEl  = document.getElementById('deck-pie-legend-left');
    const rightEl = document.getElementById('deck-pie-legend-right');
    leftEl.innerHTML  = '';
    rightEl.innerHTML = '';

    const total = data.reduce((a, b) => a + b, 0);
    const half  = Math.ceil(deckEntries.length / 2);

    deckEntries.forEach((entry, i) => {
      const entryTotal = entry.wins + entry.losses + entry.ties;
      const pct = total ? Math.round((entryTotal / total) * 100) : 0;

      const item = document.createElement('div');
      item.className = 'deck-pie-legend-item';

      const colorDot = document.createElement('span');
      colorDot.className = 'deck-pie-legend-dot';
      colorDot.style.background = _winColor(i);

      const info = document.createElement('div');
      info.className = 'deck-pie-legend-info';

      const nameRow = document.createElement('div');
      nameRow.className = 'deck-pie-legend-name';
      if (entry.spriteUrl) {
        const img = document.createElement('img');
        img.className = 'pkmn-sprite';
        img.src     = entry.spriteUrl;
        img.alt     = entry.label;
        img.width   = 24;
        img.height  = 24;
        nameRow.appendChild(img);
      }
      const nameTxt = document.createElement('span');
      nameTxt.textContent = entry.label;
      nameRow.appendChild(nameTxt);

      const pctEl = document.createElement('div');
      pctEl.className = 'deck-pie-legend-pct';
      pctEl.textContent = `${pct}% (${entry.wins}W / ${entry.losses}L)`;

      info.appendChild(nameRow);
      info.appendChild(pctEl);
      item.appendChild(colorDot);
      item.appendChild(info);

      if (i < half) {
        leftEl.appendChild(item);
      } else {
        rightEl.appendChild(item);
      }
    });
  }

  function renderStats() {
    const eventFilter = statsEventFilter.value;
    const filtered    = eventFilter === 'all' ? matches : matches.filter(m => m.event === eventFilter);

    const total  = filtered.length;
    const wins   = filtered.filter(m => m.result === 'Win').length;
    const losses = filtered.filter(m => m.result === 'Loss').length;
    const ties   = filtered.filter(m => m.result === 'Tie').length;
    const pct    = total ? Math.round((wins / total) * 100) : 0;

    document.getElementById('stats-summary').innerHTML = `
      <div class="stat-chip total"><span class="chip-val">${total}</span><span class="chip-lbl">Matches</span></div>
      <div class="stat-chip wins"><span class="chip-val">${wins}</span><span class="chip-lbl">Wins</span></div>
      <div class="stat-chip losses"><span class="chip-val">${losses}</span><span class="chip-lbl">Losses</span></div>
      <div class="stat-chip ties"><span class="chip-val">${ties}</span><span class="chip-lbl">Ties</span></div>
      <div class="stat-chip pct"><span class="chip-val">${pct}%</span><span class="chip-lbl">Win Rate</span></div>
    `;

    // Show/hide the archetype column
    const archetypeColHeader = document.getElementById('stats-archetype-col');
    if (archetypeColHeader) archetypeColHeader.style.display = statsView === 'decks' ? '' : 'none';

    // Build per-deck stats
    const deckMap = {};
    filtered.forEach(m => {
      if (!deckMap[m.myDeck]) deckMap[m.myDeck] = { wins: 0, losses: 0, ties: 0, opponents: {} };
      const key = { Win: 'wins', Loss: 'losses', Tie: 'ties' }[m.result];
      if (key) deckMap[m.myDeck][key]++;
      if (m.oppDeck) {
        if (!deckMap[m.myDeck].opponents[m.oppDeck]) {
          deckMap[m.myDeck].opponents[m.oppDeck] = { wins: 0, losses: 0, ties: 0 };
        }
        const oppKey = { Win: 'wins', Loss: 'losses', Tie: 'ties' }[m.result];
        if (oppKey) deckMap[m.myDeck].opponents[m.oppDeck][oppKey]++;
      }
    });

    const statsBody = document.getElementById('stats-body');
    const noStats   = document.getElementById('no-stats');

    if (Object.keys(deckMap).length === 0) {
      statsBody.innerHTML = '';
      noStats.classList.remove('hidden');
      document.getElementById('stats-chart-wrap').classList.add('hidden');
      if (overallChartInst) { overallChartInst.destroy(); overallChartInst = null; }
      document.getElementById('deck-pie-legend-left').innerHTML  = '';
      document.getElementById('deck-pie-legend-right').innerHTML = '';
      return;
    }
    noStats.classList.add('hidden');

    const deckRows = Object.entries(deckMap)
      .map(([deck, s]) => {
        const tot = s.wins + s.losses + s.ties;
        const wr  = tot ? Math.round((s.wins / tot) * 100) : 0;
        const deckObj = decks.find(d => d.name === deck);
        const archetype = deckObj ? (deckObj.archetype || '') : '';
        return { deck, ...s, total: tot, wr, archetype, opponents: s.opponents };
      })
      .sort((a, b) => b.wr - a.wr || b.total - a.total);

    // Build deck entries for the pie chart
    let pieEntries;
    if (statsView === 'archetypes') {
      // Aggregate by archetype
      const archetypeMap = {};
      deckRows.forEach(r => {
        const key = r.archetype || r.deck;
        if (!archetypeMap[key]) archetypeMap[key] = { wins: 0, losses: 0, ties: 0, spriteUrl: null, label: key };
        archetypeMap[key].wins   += r.wins;
        archetypeMap[key].losses += r.losses;
        archetypeMap[key].ties   += r.ties;
        // Use first sprite found for this archetype
        if (!archetypeMap[key].spriteUrl) {
          const deckObj = decks.find(d => d.name === r.deck);
          if (deckObj && deckObj.sprites && deckObj.sprites[0]) {
            const sid = spriteIdFromName(deckObj.sprites[0]);
            if (sid) archetypeMap[key].spriteUrl = homeUrl(sid);
          }
        }
      });
      pieEntries = Object.values(archetypeMap)
        .sort((a, b) => (b.wins + b.losses + b.ties) - (a.wins + a.losses + a.ties));
    } else {
      pieEntries = deckRows.map(r => {
        const deckObj = decks.find(d => d.name === r.deck);
        let spriteUrl = null;
        if (deckObj && deckObj.sprites && deckObj.sprites[0]) {
          const sid = spriteIdFromName(deckObj.sprites[0]);
          if (sid) spriteUrl = homeUrl(sid);
        }
        return { label: r.deck, wins: r.wins, losses: r.losses, ties: r.ties, spriteUrl };
      });
    }

    renderDeckDistributionChart(pieEntries);

    // Render the stats table
    statsBody.innerHTML = '';
    Object.values(deckChartInsts).forEach(c => c && c.destroy());
    Object.keys(deckChartInsts).forEach(k => delete deckChartInsts[k]);

    if (statsView === 'archetypes') {
      // Group rows by archetype
      const archetypeGroups = {};
      deckRows.forEach(r => {
        const key = r.archetype || '— No archetype —';
        if (!archetypeGroups[key]) archetypeGroups[key] = [];
        archetypeGroups[key].push(r);
      });

      let globalIdx = 0;
      Object.entries(archetypeGroups).sort((a, b) => a[0].localeCompare(b[0])).forEach(([archKey, rows]) => {
        // Archetype summary row
        const archWins   = rows.reduce((s, r) => s + r.wins,   0);
        const archLosses = rows.reduce((s, r) => s + r.losses, 0);
        const archTies   = rows.reduce((s, r) => s + r.ties,   0);
        const archTotal  = archWins + archLosses + archTies;
        const archWr     = archTotal ? Math.round((archWins / archTotal) * 100) : 0;

        const archTr = document.createElement('tr');
        archTr.className = 'archetype-row';
        archTr.innerHTML = `
          <td class="sprite-col"></td>
          <td colspan="2"><strong class="archetype-label">🗂 ${esc(archKey)}</strong></td>
          <td>${archTotal}</td>
          <td>${archWins}</td>
          <td>${archLosses}</td>
          <td>${archTies}</td>
          <td>
            <div class="wr-bar">
              <span>${archWr}%</span>
              <div class="wr-track"><div class="wr-fill" style="width:${archWr}%"></div></div>
            </div>
          </td>
          <td></td>
        `;
        statsBody.appendChild(archTr);

        rows.forEach(r => appendDeckRow(r, globalIdx++, statsBody, 'indent'));
      });
    } else {
      deckRows.forEach((r, idx) => appendDeckRow(r, idx, statsBody, ''));
    }
  }

  function appendDeckRow(r, idx, statsBody, extraClass) {
    const colCount = statsView === 'decks' ? 9 : 9;
    const tr = document.createElement('tr');
    if (extraClass) tr.classList.add(extraClass);
    tr.innerHTML = `
      <td class="sprite-col">${deckSpritesHtml(r.deck)}</td>
      <td><strong>${esc(r.deck)}</strong></td>
      <td style="${statsView === 'archetypes' ? 'display:none' : ''}">${esc(r.archetype || '')}</td>
      <td>${r.total}</td>
      <td>${r.wins}</td>
      <td>${r.losses}</td>
      <td>${r.ties}</td>
      <td>
        <div class="wr-bar">
          <span>${r.wr}%</span>
          <div class="wr-track"><div class="wr-fill" style="width:${r.wr}%"></div></div>
        </div>
      </td>
      <td>
        <button type="button" class="btn-expand" data-deck="${esc(r.deck)}" aria-expanded="false">▶ Opponents</button>
      </td>
    `;
    statsBody.appendChild(tr);

    // Expandable opponent row
    const oppTr = document.createElement('tr');
    oppTr.className = 'opp-breakdown-row hidden';
    oppTr.dataset.deck = r.deck;
    const oppEntries = Object.entries(r.opponents)
      .map(([opp, s]) => {
        const t  = s.wins + s.losses + s.ties;
        const wr = t ? Math.round((s.wins / t) * 100) : 0;
        return { opp, ...s, total: t, wr };
      })
      .sort((a, b) => b.total - a.total);

    const canvasId = `deck-pie-${idx}`;
    oppTr.innerHTML = `
      <td colspan="9" class="opp-breakdown-cell">
        <div class="opp-breakdown-inner">
          <div class="opp-breakdown-chart-wrap">
            <canvas id="${canvasId}" width="180" height="180"></canvas>
            <p class="chart-label">${esc(r.deck)}</p>
          </div>
          <table class="opp-table">
            <thead>
              <tr>
                <th>Opponent Deck</th>
                <th>W</th><th>L</th><th>T</th><th>Win%</th>
              </tr>
            </thead>
            <tbody>
              ${oppEntries.map(o => `
                <tr>
                  <td>${oppSpritesHtml(o.opp) ? oppSpritesHtml(o.opp) + ' ' : ''}${esc(o.opp)}</td>
                  <td class="opp-w">${o.wins}</td>
                  <td class="opp-l">${o.losses}</td>
                  <td class="opp-t">${o.ties}</td>
                  <td>${o.wr}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </td>
    `;
    statsBody.appendChild(oppTr);

    tr.querySelector('.btn-expand').addEventListener('click', function () {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!expanded));
      this.textContent = expanded ? '▶ Opponents' : '▼ Opponents';
      oppTr.classList.toggle('hidden', expanded);
      if (!expanded && !deckChartInsts[canvasId]) {
        deckChartInsts[canvasId] = renderPieChart(canvasId, [r.wins, r.losses, r.ties], null, null);
      }
    });
  }

  function renderPieChart(canvasId, data, existingInst, setInst) {
    if (existingInst) existingInst.destroy();
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const inst = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Wins', 'Losses', 'Ties'],
        datasets: [{
          data,
          backgroundColor: ['#2f9e44', '#c92a2a', '#868e96'],
          borderWidth: 2,
          borderColor: '#ffffff',
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 8 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } }
        },
        animation: { duration: 400 }
      }
    });
    if (setInst) setInst(inst);
    return inst;
  }

  // ────────────────────────────────────────────────────────────
  // HISTORY
  // ────────────────────────────────────────────────────────────
  document.getElementById('history-deck-filter').addEventListener('change', renderHistory);
  document.getElementById('history-event-filter').addEventListener('change', renderHistory);
  document.getElementById('history-result-filter').addEventListener('change', renderHistory);

  function renderHistory() {
    const deckFilter   = document.getElementById('history-deck-filter').value;
    const eventFilter  = document.getElementById('history-event-filter').value;
    const resultFilter = document.getElementById('history-result-filter').value;

    let filtered = [...matches].reverse();
    if (deckFilter   !== 'all') filtered = filtered.filter(m => m.myDeck === deckFilter);
    if (eventFilter  !== 'all') filtered = filtered.filter(m => m.event  === eventFilter);
    if (resultFilter !== 'all') filtered = filtered.filter(m => m.result === resultFilter);

    const historyBody = document.getElementById('history-body');
    const noHistory   = document.getElementById('no-history');

    if (filtered.length === 0) {
      historyBody.innerHTML = '';
      noHistory.classList.remove('hidden');
      return;
    }
    noHistory.classList.add('hidden');

    const VALID_RESULT_CLS = { Win: 'win', Loss: 'loss', Tie: 'tie' };

    historyBody.innerHTML = '';
    filtered.forEach(m => {
      const dateStr = m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString() : '—';

      const tr = document.createElement('tr');

      function td(text) {
        const cell = document.createElement('td');
        cell.textContent = text;
        return cell;
      }

      tr.appendChild(td(dateStr));

      const deckCell = document.createElement('td');
      deckCell.className = 'deck-cell';
      const spritesHtml = deckSpritesHtml(m.myDeck);
      if (spritesHtml) {
        deckCell.innerHTML = spritesHtml + ' <strong>' + esc(m.myDeck) + '</strong>';
      } else {
        const strong = document.createElement('strong');
        strong.textContent = m.myDeck;
        deckCell.appendChild(strong);
      }
      tr.appendChild(deckCell);

      const oppCell = document.createElement('td');
      oppCell.className = 'deck-cell';
      const oppSpr  = oppSpritesHtml(m.oppDeck);
      if (oppSpr) {
        oppCell.innerHTML = oppSpr + ' ' + esc(m.oppDeck);
      } else {
        oppCell.textContent = m.oppDeck;
      }
      tr.appendChild(oppCell);

      tr.appendChild(td(m.event));

      const resultCell = document.createElement('td');
      const badge      = document.createElement('span');
      badge.className  = 'badge ' + (VALID_RESULT_CLS[m.result] || 'tie');
      badge.textContent = m.result;
      resultCell.appendChild(badge);
      tr.appendChild(resultCell);

      const notesCell = document.createElement('td');
      notesCell.className   = 'notes-cell';
      notesCell.title       = m.notes || '';
      notesCell.textContent = m.notes || '';
      tr.appendChild(notesCell);

      const actCell = document.createElement('td');
      actCell.className = 'action-cell';
      const actWrap = document.createElement('div');
      actWrap.className = 'row-actions';

      const editBtn = document.createElement('button');
      editBtn.className   = 'btn-edit';
      editBtn.textContent = '✏';
      editBtn.title       = 'Edit match';
      editBtn.addEventListener('click', () => openEditMatchModal(m.id));
      actWrap.appendChild(editBtn);

      const delBtn  = document.createElement('button');
      delBtn.className   = 'btn-delete';
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => {
        if (!confirm('Delete this match?')) return;
        matches = matches.filter(n => n.id !== m.id);
        save(KEYS.matches, matches);
        populateDeckSelects();
        renderHistory();
        renderStats();
      });
      actWrap.appendChild(delBtn);
      actCell.appendChild(actWrap);
      tr.appendChild(actCell);

      historyBody.appendChild(tr);
    });
  }

  // ────────────────────────────────────────────────────────────
  // Utility: escape HTML to prevent XSS
  // ────────────────────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ────────────────────────────────────────────────────────────
  // Sprite helpers
  // ────────────────────────────────────────────────────────────
  function spriteImg(name) {
    const id = spriteIdFromName(name);
    if (!id) return '';
    return `<img class="pkmn-sprite" src="${homeUrl(id)}" width="32" height="32" alt="${esc(String(name))}" title="${esc(String(name))}" loading="lazy" />`;
  }

  function deckSpritesHtml(deckName) {
    const deck = decks.find(d => d.name === deckName);
    if (!deck || !deck.sprites || !deck.sprites.length) return '';
    return deck.sprites.map(s => spriteImg(s)).join(' ');
  }

  function oppSpritesHtml(deckName) {
    if (!deckName) return '';
    const sprites = oppDecks[deckName];
    if (!sprites || !sprites.length) return '';
    return sprites.map(s => spriteImg(s)).join(' ');
  }

  // ────────────────────────────────────────────────────────────
  // OPP. DECKS TAB
  // ────────────────────────────────────────────────────────────
  let pendingOppSprites = [null, null];

  function updateOppDeckTabSpritePreview(idx) {
    const name    = pendingOppSprites[idx];
    const preview = document.getElementById(`opp-sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`new-opp-sprite-${idx + 1}`);
    if (name) {
      const id = spriteIdFromName(name);
      if (id) { preview.src = homeUrl(id); preview.alt = name; }
      preview.style.display = 'inline-block';
      input.value = name;
    } else {
      preview.src = '';
      preview.style.display = 'none';
      input.value = '';
    }
  }

  document.getElementById('pick-opp-s1-btn').addEventListener('click', () => {
    openPicker(pendingOppSprites[0] ? [pendingOppSprites[0]] : [], sprites => {
      pendingOppSprites[0] = sprites[0] || null;
      pendingOppSprites[1] = sprites[1] || pendingOppSprites[1] || null;
      updateOppDeckTabSpritePreview(0);
      if (sprites[1] !== undefined) updateOppDeckTabSpritePreview(1);
    });
  });

  document.getElementById('pick-opp-s2-btn').addEventListener('click', () => {
    openPicker(pendingOppSprites[1] ? [pendingOppSprites[1]] : [], sprites => {
      pendingOppSprites[1] = sprites[0] || null;
      updateOppDeckTabSpritePreview(1);
    });
  });

  document.getElementById('add-opp-deck-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('new-opp-deck-name').value.trim();
    if (!name) return;
    const sprites = pendingOppSprites.filter(Boolean);
    oppDecks[name] = sprites.length ? sprites : (oppDecks[name] || []);
    save(KEYS.oppDecks, oppDecks);
    document.getElementById('new-opp-deck-name').value = '';
    pendingOppSprites = [null, null];
    updateOppDeckTabSpritePreview(0);
    updateOppDeckTabSpritePreview(1);
    renderOppDecks();
    populateOppDeckSelects();
  });

  function renderOppDecks() {
    const listEl = document.getElementById('opp-deck-list');
    const noEl   = document.getElementById('no-opp-decks');
    if (!listEl) return;
    listEl.innerHTML = '';
    const names = getAllOppDeckNames();
    noEl.classList.toggle('hidden', names.length > 0);
    names.forEach(name => {
      const li = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'deck-name-label';
      const sprites = oppSpritesHtml(name);
      nameSpan.innerHTML = (sprites ? sprites + ' ' : '') + esc(name);
      li.appendChild(nameSpan);

      const actions = document.createElement('div');
      actions.className = 'row-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn-edit';
      editBtn.textContent = '✏ Edit';
      editBtn.addEventListener('click', () => openEditOppDeckModal(name));
      actions.appendChild(editBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-delete';
      delBtn.textContent = 'Remove';
      delBtn.addEventListener('click', () => {
        if (!confirm(`Remove "${name}" from opponent decks? This won't delete match history.`)) return;
        delete oppDecks[name];
        save(KEYS.oppDecks, oppDecks);
        renderOppDecks();
        populateOppDeckSelects();
      });
      actions.appendChild(delBtn);
      li.appendChild(actions);
      listEl.appendChild(li);
    });
  }

  // ────────────────────────────────────────────────────────────
  // EDIT DECK MODAL
  // ────────────────────────────────────────────────────────────
  let editDeckSprites = [null, null];

  function updateEditDeckSpritePreview(idx) {
    const name    = editDeckSprites[idx];
    const preview = document.getElementById(`edit-sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`edit-sprite-${idx + 1}`);
    if (name) {
      const id = spriteIdFromName(name);
      if (id) { preview.src = homeUrl(id); preview.alt = name; }
      preview.style.display = 'inline-block';
      input.value = name;
    } else {
      preview.src = '';
      preview.style.display = 'none';
      input.value = '';
    }
  }

  function openEditDeckModal(deckName) {
    const deck = decks.find(d => d.name === deckName);
    if (!deck) return;
    document.getElementById('edit-deck-original-name').value = deckName;
    document.getElementById('edit-deck-name').value = deckName;
    document.getElementById('edit-deck-archetype').value = deck.archetype || '';
    editDeckSprites[0] = deck.sprites[0] || null;
    editDeckSprites[1] = deck.sprites[1] || null;
    updateEditDeckSpritePreview(0);
    updateEditDeckSpritePreview(1);
    document.getElementById('edit-deck-modal').classList.remove('hidden');
  }

  function closeEditDeckModal() {
    document.getElementById('edit-deck-modal').classList.add('hidden');
  }

  document.getElementById('edit-deck-close').addEventListener('click', closeEditDeckModal);
  document.getElementById('edit-deck-cancel').addEventListener('click', closeEditDeckModal);
  document.getElementById('edit-deck-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-deck-modal')) closeEditDeckModal();
  });

  document.getElementById('edit-pick-sprite-1-btn').addEventListener('click', () => {
    openPicker(editDeckSprites[0] ? [editDeckSprites[0]] : [], sprites => {
      editDeckSprites[0] = sprites[0] || null;
      editDeckSprites[1] = sprites[1] || editDeckSprites[1] || null;
      updateEditDeckSpritePreview(0);
      if (sprites[1] !== undefined) updateEditDeckSpritePreview(1);
    });
  });

  document.getElementById('edit-pick-sprite-2-btn').addEventListener('click', () => {
    openPicker(editDeckSprites[1] ? [editDeckSprites[1]] : [], sprites => {
      editDeckSprites[1] = sprites[0] || null;
      updateEditDeckSpritePreview(1);
    });
  });

  document.getElementById('edit-deck-save').addEventListener('click', () => {
    const originalName = document.getElementById('edit-deck-original-name').value;
    const newName      = document.getElementById('edit-deck-name').value.trim();
    const archetype    = document.getElementById('edit-deck-archetype').value.trim();
    if (!newName) { alert('Deck name cannot be empty.'); return; }
    if (newName !== originalName && decks.some(d => d.name === newName)) {
      alert(`"${newName}" already exists.`); return;
    }
    const sprites = editDeckSprites.filter(Boolean);
    const idx = decks.findIndex(d => d.name === originalName);
    if (idx === -1) return;
    decks[idx] = { name: newName, sprites, archetype };
    // Update match history references if name changed
    if (newName !== originalName) {
      matches = matches.map(m => m.myDeck === originalName ? { ...m, myDeck: newName } : m);
      save(KEYS.matches, matches);
    }
    save(KEYS.decks, decks);
    closeEditDeckModal();
    renderDecks();
    populateDeckSelects();
    renderHistory();
    renderStats();
  });

  // ────────────────────────────────────────────────────────────
  // EDIT OPP. DECK MODAL
  // ────────────────────────────────────────────────────────────
  let editOppDeckSprites = [null, null];

  function updateEditOppDeckSpritePreview(idx) {
    const name    = editOppDeckSprites[idx];
    const preview = document.getElementById(`edit-opp-sprite-preview-${idx + 1}`);
    const input   = document.getElementById(`edit-opp-sprite-${idx + 1}`);
    if (name) {
      const id = spriteIdFromName(name);
      if (id) { preview.src = homeUrl(id); preview.alt = name; }
      preview.style.display = 'inline-block';
      input.value = name;
    } else {
      preview.src = '';
      preview.style.display = 'none';
      input.value = '';
    }
  }

  function openEditOppDeckModal(deckName) {
    const sprites = oppDecks[deckName] || [];
    document.getElementById('edit-opp-deck-original-name').value = deckName;
    document.getElementById('edit-opp-deck-name').value = deckName;
    editOppDeckSprites[0] = sprites[0] || null;
    editOppDeckSprites[1] = sprites[1] || null;
    updateEditOppDeckSpritePreview(0);
    updateEditOppDeckSpritePreview(1);
    document.getElementById('edit-opp-deck-modal').classList.remove('hidden');
  }

  function closeEditOppDeckModal() {
    document.getElementById('edit-opp-deck-modal').classList.add('hidden');
  }

  document.getElementById('edit-opp-deck-close').addEventListener('click', closeEditOppDeckModal);
  document.getElementById('edit-opp-deck-cancel').addEventListener('click', closeEditOppDeckModal);
  document.getElementById('edit-opp-deck-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-opp-deck-modal')) closeEditOppDeckModal();
  });

  document.getElementById('edit-opp-pick-sprite-1-btn').addEventListener('click', () => {
    openPicker(editOppDeckSprites[0] ? [editOppDeckSprites[0]] : [], sprites => {
      editOppDeckSprites[0] = sprites[0] || null;
      editOppDeckSprites[1] = sprites[1] || editOppDeckSprites[1] || null;
      updateEditOppDeckSpritePreview(0);
      if (sprites[1] !== undefined) updateEditOppDeckSpritePreview(1);
    });
  });

  document.getElementById('edit-opp-pick-sprite-2-btn').addEventListener('click', () => {
    openPicker(editOppDeckSprites[1] ? [editOppDeckSprites[1]] : [], sprites => {
      editOppDeckSprites[1] = sprites[0] || null;
      updateEditOppDeckSpritePreview(1);
    });
  });

  document.getElementById('edit-opp-deck-save').addEventListener('click', () => {
    const originalName = document.getElementById('edit-opp-deck-original-name').value;
    const newName      = document.getElementById('edit-opp-deck-name').value.trim();
    if (!newName) { alert('Deck name cannot be empty.'); return; }
    const sprites = editOppDeckSprites.filter(Boolean);
    // If name changed, migrate oppDecks key and match history
    if (newName !== originalName) {
      delete oppDecks[originalName];
      matches = matches.map(m => m.oppDeck === originalName ? { ...m, oppDeck: newName } : m);
      save(KEYS.matches, matches);
    }
    oppDecks[newName] = sprites;
    save(KEYS.oppDecks, oppDecks);
    closeEditOppDeckModal();
    renderOppDecks();
    populateOppDeckSelects();
    renderHistory();
    renderStats();
  });

  // ────────────────────────────────────────────────────────────
  // EDIT MATCH MODAL
  // ────────────────────────────────────────────────────────────
  function openEditMatchModal(matchId) {
    const m = matches.find(x => x.id === matchId);
    if (!m) return;

    // Populate your deck select
    const myDeckSel = document.getElementById('edit-my-deck');
    const allNames = new Set([...decks.map(d => d.name), ...matches.map(x => x.myDeck)]);
    myDeckSel.innerHTML = '<option value="" disabled selected>— select your deck —</option>';
    [...allNames].sort().forEach(d => {
      myDeckSel.insertAdjacentHTML('beforeend', `<option value="${esc(d)}">${esc(d)}</option>`);
    });

    // Populate opp deck select
    populateOppDeckSelects();

    document.getElementById('edit-match-id').value     = m.id;
    myDeckSel.value                                     = m.myDeck;
    document.getElementById('edit-event-type').value   = m.event;
    document.getElementById('edit-match-date').value   = m.date;
    document.getElementById('edit-match-notes').value  = m.notes || '';

    // Set opp deck
    const oppSel   = document.getElementById('edit-opp-deck-select');
    const newWrap  = document.getElementById('edit-opp-new-deck-wrap');
    const hiddenIn = document.getElementById('edit-opp-deck');
    const knownNames = getAllOppDeckNames();
    if (knownNames.includes(m.oppDeck)) {
      oppSel.value = m.oppDeck;
      newWrap.classList.add('hidden');
    } else {
      oppSel.value = '__new__';
      newWrap.classList.remove('hidden');
      document.getElementById('edit-opp-deck-new-input').value = m.oppDeck;
    }
    hiddenIn.value = m.oppDeck;

    // Set result
    const editResultInput = document.getElementById('edit-result-input');
    editResultInput.value = m.result;
    document.querySelectorAll('.edit-result-btn').forEach(b => {
      b.classList.toggle('selected', b.dataset.result === m.result);
    });

    document.getElementById('edit-match-modal').classList.remove('hidden');
  }

  function closeEditMatchModal() {
    document.getElementById('edit-match-modal').classList.add('hidden');
  }

  document.getElementById('edit-match-close').addEventListener('click', closeEditMatchModal);
  document.getElementById('edit-match-cancel').addEventListener('click', closeEditMatchModal);
  document.getElementById('edit-match-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('edit-match-modal')) closeEditMatchModal();
  });

  // Edit match result buttons
  document.querySelectorAll('.edit-result-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.edit-result-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('edit-result-input').value = btn.dataset.result;
    });
  });

  document.getElementById('edit-match-save').addEventListener('click', () => {
    const id      = Number(document.getElementById('edit-match-id').value);
    const myDeck  = document.getElementById('edit-my-deck').value;
    const oppDeck = document.getElementById('edit-opp-deck').value.trim();
    const result  = document.getElementById('edit-result-input').value;
    const event   = document.getElementById('edit-event-type').value;
    const date    = document.getElementById('edit-match-date').value;
    const notes   = document.getElementById('edit-match-notes').value.trim();

    if (!myDeck)  { alert('Please select your deck.'); return; }
    if (!oppDeck) { alert('Please select an opponent deck or enter a new deck name.'); return; }
    if (!result)  { alert('Please select a result.'); return; }
    if (!event)   { alert('Please select an event.'); return; }
    if (!date)    { alert('Please enter a date.'); return; }

    const idx = matches.findIndex(m => m.id === id);
    if (idx === -1) return;
    matches[idx] = { id, myDeck, oppDeck, result, event, date, notes };
    save(KEYS.matches, matches);
    closeEditMatchModal();
    populateDeckSelects();
    renderHistory();
    renderStats();
  });

  // ────────────────────────────────────────────────────────────
  // DATA TAB – Export / Import / Clear
  // ────────────────────────────────────────────────────────────

  document.getElementById('export-btn').addEventListener('click', () => {
    const data = {
      decks,
      oppDecks,
      matches
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pkmn-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  const importFileInput   = document.getElementById('import-file');
  const importFileNameEl  = document.getElementById('import-file-name');
  const importBtn         = document.getElementById('import-btn');
  const importSuccessEl   = document.getElementById('import-success');
  const importErrorEl     = document.getElementById('import-error');
  let pendingImportData   = null;

  importFileInput.addEventListener('change', () => {
    const file = importFileInput.files[0];
    importSuccessEl.classList.add('hidden');
    importErrorEl.classList.add('hidden');
    pendingImportData = null;
    importBtn.disabled = true;

    if (!file) {
      importFileNameEl.textContent = 'No file chosen';
      return;
    }
    importFileNameEl.textContent = file.name;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid format');
        // Validate decks array
        if ('decks' in parsed) {
          if (!Array.isArray(parsed.decks)) throw new Error('decks must be an array');
          for (const d of parsed.decks) {
            if (typeof d !== 'string' && (typeof d !== 'object' || d === null || typeof d.name !== 'string')) {
              throw new Error('Each deck must have a name');
            }
          }
        }
        // Validate oppDecks object
        if ('oppDecks' in parsed) {
          if (typeof parsed.oppDecks !== 'object' || parsed.oppDecks === null || Array.isArray(parsed.oppDecks)) {
            throw new Error('oppDecks must be an object');
          }
          for (const sprites of Object.values(parsed.oppDecks)) {
            if (!Array.isArray(sprites)) throw new Error('oppDecks values must be arrays');
          }
        }
        // Validate matches array
        if ('matches' in parsed) {
          if (!Array.isArray(parsed.matches)) throw new Error('matches must be an array');
          for (const m of parsed.matches) {
            if (typeof m !== 'object' || m === null ||
                typeof m.myDeck !== 'string' || typeof m.oppDeck !== 'string' ||
                typeof m.result !== 'string' || typeof m.date !== 'string') {
              throw new Error('Each match must have myDeck, oppDeck, result, and date');
            }
          }
        }
        pendingImportData = parsed;
        importBtn.disabled = false;
      } catch (err) {
        importErrorEl.textContent = `Invalid file: ${err.message}. Please choose a valid export file.`;
        importErrorEl.classList.remove('hidden');
      }
    };
    reader.readAsText(file);
  });

  importBtn.addEventListener('click', () => {
    if (!pendingImportData) return;
    if (!confirm('This will replace all existing data. Continue?')) return;

    if (Array.isArray(pendingImportData.decks)) {
      decks = pendingImportData.decks.map(d => typeof d === 'string' ? { name: d, sprites: [], archetype: '' } : { archetype: '', ...d });
      save(KEYS.decks, decks);
    }
    if (pendingImportData.oppDecks && typeof pendingImportData.oppDecks === 'object' && !Array.isArray(pendingImportData.oppDecks)) {
      oppDecks = pendingImportData.oppDecks;
      save(KEYS.oppDecks, oppDecks);
    }
    if (Array.isArray(pendingImportData.matches)) {
      matches = pendingImportData.matches;
      save(KEYS.matches, matches);
    }

    pendingImportData = null;
    importBtn.disabled = true;
    importFileInput.value = '';
    importFileNameEl.textContent = 'No file chosen';
    importErrorEl.classList.add('hidden');
    importSuccessEl.classList.remove('hidden');

    renderDecks();
    renderOppDecks();
    populateDeckSelects();
    renderStats();
    renderHistory();
  });

  document.getElementById('clear-matches-btn').addEventListener('click', () => {
    if (!confirm('Delete all match history? This cannot be undone.')) return;
    matches = [];
    save(KEYS.matches, matches);
    renderStats();
    renderHistory();
  });

  document.getElementById('clear-all-btn').addEventListener('click', () => {
    if (!confirm('Delete ALL data (decks, opponent decks, and match history)? This cannot be undone.')) return;
    decks    = [];
    oppDecks = {};
    matches  = [];
    save(KEYS.decks,    decks);
    save(KEYS.oppDecks, oppDecks);
    save(KEYS.matches,  matches);
    renderDecks();
    renderOppDecks();
    populateDeckSelects();
    renderStats();
    renderHistory();
  });

  // ────────────────────────────────────────────────────────────
  // INIT
  // ────────────────────────────────────────────────────────────
  renderDecks();
  populateDeckSelects();
  renderStats();
  renderHistory();
})();
