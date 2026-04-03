#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "assets",
  "data",
  "wanikani-massive-dump.json"
);
const DATA_UPDATED_AT = new Date().toISOString();
const SRS_ID = 1;

const LEVEL_DEFINITIONS = [
  {
    level: 1,
    radicals: [
      { slug: "ground", characters: "一", meanings: ["ground"], auxiliary: ["floor"] },
      { slug: "stick", characters: "丨", meanings: ["stick"], auxiliary: ["pole"] },
      { slug: "drop", characters: "丶", meanings: ["drop"], auxiliary: ["dot"] },
      { slug: "hook", characters: "亅", meanings: ["hook"], auxiliary: ["barb"] },
      { slug: "box", characters: "口", meanings: ["box"], auxiliary: ["square"] },
      { slug: "person", characters: "人", meanings: ["person"], auxiliary: ["human"] },
      { slug: "tree", characters: "木", meanings: ["tree"], auxiliary: ["wood"] },
      { slug: "sun", characters: "日", meanings: ["sun"], auxiliary: ["day"] },
      { slug: "moon", characters: "月", meanings: ["moon"], auxiliary: ["month"] },
      { slug: "mountain", characters: "山", meanings: ["mountain"], auxiliary: ["peak"] },
    ],
    kanji: [
      {
        slug: "one",
        characters: "一",
        meanings: ["one"],
        auxiliary: ["single"],
        readings: [
          { value: "いち", type: "onyomi" },
          { value: "ひと", type: "kunyomi" },
        ],
      },
      {
        slug: "two",
        characters: "二",
        meanings: ["two"],
        auxiliary: ["double"],
        readings: [{ value: "に", type: "onyomi" }],
      },
      {
        slug: "three",
        characters: "三",
        meanings: ["three"],
        auxiliary: ["triple"],
        readings: [{ value: "さん", type: "onyomi" }],
      },
      {
        slug: "person",
        characters: "人",
        meanings: ["person"],
        auxiliary: ["human"],
        readings: [
          { value: "じん", type: "onyomi" },
          { value: "ひと", type: "kunyomi" },
        ],
      },
      {
        slug: "mouth",
        characters: "口",
        meanings: ["mouth"],
        auxiliary: ["opening"],
        readings: [
          { value: "こう", type: "onyomi" },
          { value: "くち", type: "kunyomi" },
        ],
      },
      {
        slug: "sun",
        characters: "日",
        meanings: ["sun", "day"],
        readings: [
          { value: "にち", type: "onyomi" },
          { value: "ひ", type: "kunyomi" },
        ],
      },
      {
        slug: "moon",
        characters: "月",
        meanings: ["moon", "month"],
        readings: [
          { value: "げつ", type: "onyomi" },
          { value: "つき", type: "kunyomi" },
        ],
      },
      {
        slug: "mountain",
        characters: "山",
        meanings: ["mountain"],
        auxiliary: ["hill"],
        readings: [
          { value: "さん", type: "onyomi" },
          { value: "やま", type: "kunyomi" },
        ],
      },
      {
        slug: "river",
        characters: "川",
        meanings: ["river"],
        auxiliary: ["stream"],
        readings: [
          { value: "せん", type: "onyomi" },
          { value: "かわ", type: "kunyomi" },
        ],
      },
      {
        slug: "tree",
        characters: "木",
        meanings: ["tree", "wood"],
        readings: [
          { value: "もく", type: "onyomi" },
          { value: "き", type: "kunyomi" },
        ],
      },
    ],
    vocabulary: [
      { slug: "hitotsu", characters: "一つ", meanings: ["one thing", "one"], readings: ["ひとつ"] },
      { slug: "futatsu", characters: "二つ", meanings: ["two things", "two"], readings: ["ふたつ"] },
      { slug: "mittsu", characters: "三つ", meanings: ["three things", "three"], readings: ["みっつ"] },
      { slug: "hito", characters: "人", meanings: ["person"], readings: ["ひと"] },
      { slug: "kuchi", characters: "口", meanings: ["mouth"], readings: ["くち"] },
      { slug: "hi", characters: "日", meanings: ["day", "sun"], readings: ["ひ"] },
      { slug: "tsuki", characters: "月", meanings: ["moon", "month"], readings: ["つき"] },
      { slug: "yama", characters: "山", meanings: ["mountain"], readings: ["やま"] },
      { slug: "kawa", characters: "川", meanings: ["river"], readings: ["かわ"] },
      { slug: "ki", characters: "木", meanings: ["tree", "wood"], readings: ["き"] },
    ],
  },
  {
    level: 2,
    radicals: [
      { slug: "woman", characters: "女", meanings: ["woman"], auxiliary: ["female"] },
      { slug: "child", characters: "子", meanings: ["child"], auxiliary: ["kid"] },
      { slug: "hand", characters: "手", meanings: ["hand"], auxiliary: ["palm"] },
      { slug: "water", characters: "水", meanings: ["water"], auxiliary: ["liquid"] },
      { slug: "fire", characters: "火", meanings: ["fire"], auxiliary: ["flame"] },
      { slug: "thread", characters: "糸", meanings: ["thread"], auxiliary: ["string"] },
      { slug: "shell", characters: "貝", meanings: ["shell"], auxiliary: ["clam"] },
      { slug: "vehicle", characters: "車", meanings: ["vehicle"], auxiliary: ["car"] },
      { slug: "heart", characters: "心", meanings: ["heart"], auxiliary: ["mind"] },
      { slug: "speech", characters: "言", meanings: ["speech"], auxiliary: ["say"] },
    ],
    kanji: [
      {
        slug: "woman",
        characters: "女",
        meanings: ["woman"],
        auxiliary: ["female"],
        readings: [
          { value: "じょ", type: "onyomi" },
          { value: "おんな", type: "kunyomi" },
        ],
      },
      {
        slug: "child",
        characters: "子",
        meanings: ["child"],
        auxiliary: ["kid"],
        readings: [
          { value: "し", type: "onyomi" },
          { value: "こ", type: "kunyomi" },
        ],
      },
      {
        slug: "hand",
        characters: "手",
        meanings: ["hand"],
        auxiliary: ["skill"],
        readings: [
          { value: "しゅ", type: "onyomi" },
          { value: "て", type: "kunyomi" },
        ],
      },
      {
        slug: "water",
        characters: "水",
        meanings: ["water"],
        auxiliary: ["liquid"],
        readings: [
          { value: "すい", type: "onyomi" },
          { value: "みず", type: "kunyomi" },
        ],
      },
      {
        slug: "fire",
        characters: "火",
        meanings: ["fire"],
        auxiliary: ["flame"],
        readings: [
          { value: "か", type: "onyomi" },
          { value: "ひ", type: "kunyomi" },
        ],
      },
      {
        slug: "dog",
        characters: "犬",
        meanings: ["dog"],
        auxiliary: ["hound"],
        readings: [
          { value: "けん", type: "onyomi" },
          { value: "いぬ", type: "kunyomi" },
        ],
      },
      {
        slug: "eye",
        characters: "目",
        meanings: ["eye"],
        auxiliary: ["vision"],
        readings: [
          { value: "もく", type: "onyomi" },
          { value: "め", type: "kunyomi" },
        ],
      },
      {
        slug: "ear",
        characters: "耳",
        meanings: ["ear"],
        auxiliary: ["hearing"],
        readings: [
          { value: "じ", type: "onyomi" },
          { value: "みみ", type: "kunyomi" },
        ],
      },
      {
        slug: "foot",
        characters: "足",
        meanings: ["foot", "leg"],
        readings: [
          { value: "そく", type: "onyomi" },
          { value: "あし", type: "kunyomi" },
        ],
      },
      {
        slug: "power",
        characters: "力",
        meanings: ["power", "strength"],
        readings: [
          { value: "りょく", type: "onyomi" },
          { value: "ちから", type: "kunyomi" },
        ],
      },
    ],
    vocabulary: [
      { slug: "onna", characters: "女", meanings: ["woman"], readings: ["おんな"] },
      { slug: "kodomo", characters: "子ども", meanings: ["child"], readings: ["こども"] },
      { slug: "te", characters: "手", meanings: ["hand"], readings: ["て"] },
      { slug: "mizu", characters: "水", meanings: ["water"], readings: ["みず"] },
      { slug: "hi", characters: "火", meanings: ["fire"], readings: ["ひ"] },
      { slug: "inu", characters: "犬", meanings: ["dog"], readings: ["いぬ"] },
      { slug: "me", characters: "目", meanings: ["eye"], readings: ["め"] },
      { slug: "mimi", characters: "耳", meanings: ["ear"], readings: ["みみ"] },
      { slug: "ashi", characters: "足", meanings: ["foot"], readings: ["あし"] },
      { slug: "chikara", characters: "力", meanings: ["strength", "power"], readings: ["ちから"] },
    ],
  },
  {
    level: 3,
    radicals: [
      { slug: "soil", characters: "土", meanings: ["soil"], auxiliary: ["earth"] },
      { slug: "rice-field", characters: "田", meanings: ["rice field"], auxiliary: ["field"] },
      { slug: "stone", characters: "石", meanings: ["stone"], auxiliary: ["rock"] },
      { slug: "bamboo", characters: "竹", meanings: ["bamboo"], auxiliary: ["stalk"] },
      { slug: "rain", characters: "雨", meanings: ["rain"], auxiliary: ["weather"] },
      { slug: "gold", characters: "金", meanings: ["gold"], auxiliary: ["metal"] },
      { slug: "gate", characters: "門", meanings: ["gate"], auxiliary: ["entrance"] },
      { slug: "roof", characters: "宀", meanings: ["roof"], auxiliary: ["cover"] },
      { slug: "cloth", characters: "巾", meanings: ["cloth"], auxiliary: ["fabric"] },
      { slug: "morning", characters: "早", meanings: ["morning"], auxiliary: ["early"] },
    ],
    kanji: [
      {
        slug: "soil",
        characters: "土",
        meanings: ["soil", "earth"],
        readings: [
          { value: "ど", type: "onyomi" },
          { value: "つち", type: "kunyomi" },
        ],
      },
      {
        slug: "rice-field",
        characters: "田",
        meanings: ["rice field"],
        auxiliary: ["field"],
        readings: [
          { value: "でん", type: "onyomi" },
          { value: "た", type: "kunyomi" },
        ],
      },
      {
        slug: "stone",
        characters: "石",
        meanings: ["stone"],
        auxiliary: ["rock"],
        readings: [
          { value: "せき", type: "onyomi" },
          { value: "いし", type: "kunyomi" },
        ],
      },
      {
        slug: "bamboo",
        characters: "竹",
        meanings: ["bamboo"],
        readings: [
          { value: "ちく", type: "onyomi" },
          { value: "たけ", type: "kunyomi" },
        ],
      },
      {
        slug: "rain",
        characters: "雨",
        meanings: ["rain"],
        readings: [
          { value: "う", type: "onyomi" },
          { value: "あめ", type: "kunyomi" },
        ],
      },
      {
        slug: "gold",
        characters: "金",
        meanings: ["gold", "money"],
        readings: [
          { value: "きん", type: "onyomi" },
          { value: "かね", type: "kunyomi" },
        ],
      },
      {
        slug: "gate",
        characters: "門",
        meanings: ["gate"],
        auxiliary: ["portal"],
        readings: [{ value: "もん", type: "onyomi" }],
      },
      {
        slug: "study",
        characters: "学",
        meanings: ["study", "learning"],
        readings: [
          { value: "がく", type: "onyomi" },
          { value: "まな", type: "kunyomi" },
        ],
      },
      {
        slug: "school",
        characters: "校",
        meanings: ["school"],
        auxiliary: ["campus"],
        readings: [{ value: "こう", type: "onyomi" }],
      },
      {
        slug: "previous",
        characters: "先",
        meanings: ["previous", "ahead"],
        readings: [
          { value: "せん", type: "onyomi" },
          { value: "さき", type: "kunyomi" },
        ],
      },
    ],
    vocabulary: [
      { slug: "tsuchi", characters: "土", meanings: ["soil", "earth"], readings: ["つち"] },
      { slug: "ta", characters: "田", meanings: ["rice field"], readings: ["た"] },
      { slug: "ishi", characters: "石", meanings: ["stone"], readings: ["いし"] },
      { slug: "take", characters: "竹", meanings: ["bamboo"], readings: ["たけ"] },
      { slug: "ame", characters: "雨", meanings: ["rain"], readings: ["あめ"] },
      { slug: "okane", characters: "お金", meanings: ["money"], readings: ["おかね"] },
      { slug: "mon", characters: "門", meanings: ["gate"], readings: ["もん"] },
      { slug: "gakkou", characters: "学校", meanings: ["school"], readings: ["がっこう"] },
      { slug: "sensei", characters: "先生", meanings: ["teacher"], readings: ["せんせい"] },
      { slug: "saki", characters: "先", meanings: ["ahead", "previous"], readings: ["さき"] },
    ],
  },
  {
    level: 4,
    radicals: [
      { slug: "grass", characters: "艹", meanings: ["grass"], auxiliary: ["plants"] },
      { slug: "insect", characters: "虫", meanings: ["insect"], auxiliary: ["bug"] },
      { slug: "fish", characters: "魚", meanings: ["fish"], auxiliary: ["seafood"] },
      { slug: "horse", characters: "馬", meanings: ["horse"], auxiliary: ["steed"] },
      { slug: "door", characters: "戸", meanings: ["door"], auxiliary: ["doorway"] },
      { slug: "knife", characters: "刀", meanings: ["knife"], auxiliary: ["blade"] },
      { slug: "boat", characters: "舟", meanings: ["boat"], auxiliary: ["ship"] },
      { slug: "hill", characters: "阝", meanings: ["hill"], auxiliary: ["mound"] },
      { slug: "cover", characters: "冖", meanings: ["cover"], auxiliary: ["lid"] },
      { slug: "house", characters: "家", meanings: ["house"], auxiliary: ["home"] },
    ],
    kanji: [
      {
        slug: "sky",
        characters: "空",
        meanings: ["sky", "empty"],
        readings: [
          { value: "くう", type: "onyomi" },
          { value: "そら", type: "kunyomi" },
        ],
      },
      {
        slug: "grass",
        characters: "草",
        meanings: ["grass"],
        auxiliary: ["weed"],
        readings: [
          { value: "そう", type: "onyomi" },
          { value: "くさ", type: "kunyomi" },
        ],
      },
      {
        slug: "insect",
        characters: "虫",
        meanings: ["insect", "bug"],
        readings: [
          { value: "ちゅう", type: "onyomi" },
          { value: "むし", type: "kunyomi" },
        ],
      },
      {
        slug: "fish",
        characters: "魚",
        meanings: ["fish"],
        readings: [
          { value: "ぎょ", type: "onyomi" },
          { value: "さかな", type: "kunyomi" },
        ],
      },
      {
        slug: "horse",
        characters: "馬",
        meanings: ["horse"],
        readings: [
          { value: "ば", type: "onyomi" },
          { value: "うま", type: "kunyomi" },
        ],
      },
      {
        slug: "door",
        characters: "戸",
        meanings: ["door"],
        readings: [
          { value: "こ", type: "onyomi" },
          { value: "と", type: "kunyomi" },
        ],
      },
      {
        slug: "sword",
        characters: "刀",
        meanings: ["sword", "knife"],
        readings: [
          { value: "とう", type: "onyomi" },
          { value: "かたな", type: "kunyomi" },
        ],
      },
      {
        slug: "cloth",
        characters: "布",
        meanings: ["cloth"],
        auxiliary: ["fabric"],
        readings: [
          { value: "ふ", type: "onyomi" },
          { value: "ぬの", type: "kunyomi" },
        ],
      },
      {
        slug: "boat",
        characters: "船",
        meanings: ["boat", "ship"],
        readings: [
          { value: "せん", type: "onyomi" },
          { value: "ふね", type: "kunyomi" },
        ],
      },
      {
        slug: "house",
        characters: "家",
        meanings: ["house", "home"],
        readings: [
          { value: "か", type: "onyomi" },
          { value: "いえ", type: "kunyomi" },
        ],
      },
    ],
    vocabulary: [
      { slug: "sora", characters: "空", meanings: ["sky"], readings: ["そら"] },
      { slug: "kusa", characters: "草", meanings: ["grass"], readings: ["くさ"] },
      { slug: "mushi", characters: "虫", meanings: ["insect", "bug"], readings: ["むし"] },
      { slug: "sakana", characters: "魚", meanings: ["fish"], readings: ["さかな"] },
      { slug: "uma", characters: "馬", meanings: ["horse"], readings: ["うま"] },
      { slug: "to", characters: "戸", meanings: ["door"], readings: ["と"] },
      { slug: "katana", characters: "刀", meanings: ["sword"], readings: ["かたな"] },
      { slug: "nuno", characters: "布", meanings: ["cloth"], readings: ["ぬの"] },
      { slug: "fune", characters: "船", meanings: ["boat"], readings: ["ふね"] },
      { slug: "ie", characters: "家", meanings: ["house", "home"], readings: ["いえ"] },
    ],
  },
  {
    level: 5,
    radicals: [
      { slug: "book", characters: "本", meanings: ["book"], auxiliary: ["origin"] },
      { slug: "east", characters: "東", meanings: ["east"], auxiliary: ["eastern"] },
      { slug: "west", characters: "西", meanings: ["west"], auxiliary: ["western"] },
      { slug: "south", characters: "南", meanings: ["south"], auxiliary: ["southern"] },
      { slug: "north", characters: "北", meanings: ["north"], auxiliary: ["northern"] },
      { slug: "long", characters: "長", meanings: ["long"], auxiliary: ["leader"] },
      { slug: "eat", characters: "食", meanings: ["eat"], auxiliary: ["food"] },
      { slug: "road", characters: "辶", meanings: ["road"], auxiliary: ["movement"] },
      { slug: "sickness", characters: "疒", meanings: ["sickness"], auxiliary: ["illness"] },
      { slug: "run", characters: "走", meanings: ["run"], auxiliary: ["dash"] },
    ],
    kanji: [
      {
        slug: "book",
        characters: "本",
        meanings: ["book", "origin"],
        readings: [
          { value: "ほん", type: "onyomi" },
          { value: "もと", type: "kunyomi" },
        ],
      },
      {
        slug: "east",
        characters: "東",
        meanings: ["east"],
        readings: [
          { value: "とう", type: "onyomi" },
          { value: "ひがし", type: "kunyomi" },
        ],
      },
      {
        slug: "west",
        characters: "西",
        meanings: ["west"],
        readings: [
          { value: "せい", type: "onyomi" },
          { value: "にし", type: "kunyomi" },
        ],
      },
      {
        slug: "south",
        characters: "南",
        meanings: ["south"],
        readings: [
          { value: "なん", type: "onyomi" },
          { value: "みなみ", type: "kunyomi" },
        ],
      },
      {
        slug: "north",
        characters: "北",
        meanings: ["north"],
        readings: [
          { value: "ほく", type: "onyomi" },
          { value: "きた", type: "kunyomi" },
        ],
      },
      {
        slug: "long",
        characters: "長",
        meanings: ["long"],
        auxiliary: ["leader"],
        readings: [
          { value: "ちょう", type: "onyomi" },
          { value: "なが", type: "kunyomi" },
        ],
      },
      {
        slug: "eat",
        characters: "食",
        meanings: ["eat", "food"],
        readings: [
          { value: "しょく", type: "onyomi" },
          { value: "た", type: "kunyomi" },
        ],
      },
      {
        slug: "run",
        characters: "走",
        meanings: ["run"],
        auxiliary: ["race"],
        readings: [
          { value: "そう", type: "onyomi" },
          { value: "はし", type: "kunyomi" },
        ],
      },
      {
        slug: "illness",
        characters: "病",
        meanings: ["illness", "sick"],
        readings: [
          { value: "びょう", type: "onyomi" },
          { value: "やまい", type: "kunyomi" },
        ],
      },
      {
        slug: "station",
        characters: "駅",
        meanings: ["station"],
        auxiliary: ["train station"],
        readings: [{ value: "えき", type: "onyomi" }],
      },
    ],
    vocabulary: [
      { slug: "hon", characters: "本", meanings: ["book"], readings: ["ほん"] },
      { slug: "higashi", characters: "東", meanings: ["east"], readings: ["ひがし"] },
      { slug: "nishiguchi", characters: "西口", meanings: ["west exit"], readings: ["にしぐち"] },
      { slug: "minamiguchi", characters: "南口", meanings: ["south exit"], readings: ["みなみぐち"] },
      { slug: "kitaguchi", characters: "北口", meanings: ["north exit"], readings: ["きたぐち"] },
      { slug: "nagai", characters: "長い", meanings: ["long"], readings: ["ながい"] },
      { slug: "taberu", characters: "食べる", meanings: ["to eat"], readings: ["たべる"] },
      { slug: "hashiru", characters: "走る", meanings: ["to run"], readings: ["はしる"] },
      { slug: "byouki", characters: "病気", meanings: ["illness", "sickness"], readings: ["びょうき"] },
      { slug: "eki", characters: "駅", meanings: ["station"], readings: ["えき"] },
    ],
  },
];

function titleCase(value) {
  return value
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function articleFor(word) {
  return /^[aeiou]/i.test(word) ? "an" : "a";
}

function sentenceList(values) {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function buildMeaningEntries(meanings) {
  return meanings.map((meaning, index) => ({
    meaning: titleCase(meaning),
    primary: index === 0,
    accepted_answer: true,
  }));
}

function buildAuxiliaryMeaningEntries(auxiliary = []) {
  return auxiliary.map((meaning) => ({
    meaning: titleCase(meaning),
    type: "whitelist",
  }));
}

function buildReadingEntries(readings) {
  return readings.map((reading, index) => ({
    reading: reading.value,
    primary: index === 0,
    accepted_answer: true,
    ...(reading.type ? { type: reading.type } : {}),
  }));
}

function buildVocabularyReadings(readings) {
  return readings.map((reading, index) => ({
    reading,
    primary: index === 0,
    accepted_answer: true,
  }));
}

function makeRadicalMnemonic(item) {
  return `Picture ${item.characters || item.slug} as ${articleFor(item.meanings[0])} ${item.meanings[0]}. That simple image makes the radical meaning "${item.meanings[0]}" easy to remember.`;
}

function makeKanjiMeaningMnemonic(item) {
  return `Keep the core idea of "${item.meanings[0]}" tied to the shape ${item.characters}. Recalling that central image will make this kanji easier to recognize in reviews.`;
}

function makeKanjiReadingMnemonic(item) {
  const primaryReading = item.readings[0];
  return `Start with the reading ${primaryReading.value}. It is the main ${primaryReading.type || "Japanese"} reading to remember first for ${item.characters}.`;
}

function makeVocabularyMeaningMnemonic(item) {
  return `When you see ${item.characters}, think "${item.meanings[0]}". Treat the full written form as one unit so the meaning comes up quickly during lessons and reviews.`;
}

function makeVocabularyReadingMnemonic(item) {
  return `Read this vocabulary as ${sentenceList(item.readings)}. Say it as one spoken word instead of splitting it back into individual kanji readings.`;
}

function buildDocumentUrl(type, item) {
  const target = type === "radical" ? item.slug : item.characters || item.slug;
  const encodedTarget = encodeURIComponent(target);
  return `https://www.wanikani.com/${type}s/${encodedTarget}`;
}

function makeCollectionItem({ id, level, type, item, lessonPosition }) {
  const isRadical = type === "radical";
  const isKanji = type === "kanji";

  return {
    id,
    object: type,
    url: `local://subjects/${id}`,
    data_updated_at: DATA_UPDATED_AT,
    data: {
      level,
      slug: item.slug,
      characters: item.characters ?? null,
      document_url: buildDocumentUrl(type, item),
      lesson_position: lessonPosition,
      spaced_repetition_system_id: SRS_ID,
      meaning_mnemonic: isRadical
        ? makeRadicalMnemonic(item)
        : isKanji
          ? makeKanjiMeaningMnemonic(item)
          : makeVocabularyMeaningMnemonic(item),
      ...(isRadical
        ? {}
        : {
            reading_mnemonic: isKanji
              ? makeKanjiReadingMnemonic(item)
              : makeVocabularyReadingMnemonic(item),
          }),
      meanings: buildMeaningEntries(item.meanings),
      ...(item.auxiliary?.length
        ? { auxiliary_meanings: buildAuxiliaryMeaningEntries(item.auxiliary) }
        : {}),
      ...(isRadical
        ? {}
        : {
            readings: isKanji
              ? buildReadingEntries(item.readings)
              : buildVocabularyReadings(item.readings),
          }),
    },
  };
}

function validateCollection(collection) {
  if (!collection || !Array.isArray(collection.data)) {
    throw new Error("Collection must contain a data array.");
  }

  if (collection.data.length < 150) {
    throw new Error(`Expected at least 150 items, received ${collection.data.length}.`);
  }

  for (const item of collection.data) {
    if (typeof item.id !== "number") {
      throw new Error("Every subject must have a numeric id.");
    }

    if (!["radical", "kanji", "vocabulary"].includes(item.object)) {
      throw new Error(`Invalid subject object type for id ${item.id}.`);
    }

    if (!item.data || typeof item.data !== "object") {
      throw new Error(`Missing data payload for id ${item.id}.`);
    }

    if (typeof item.data.level !== "number" || item.data.level < 1 || item.data.level > 5) {
      throw new Error(`Invalid level for id ${item.id}.`);
    }

    if (typeof item.data.slug !== "string" || item.data.slug.trim().length === 0) {
      throw new Error(`Invalid slug for id ${item.id}.`);
    }

    if (!Array.isArray(item.data.meanings) || item.data.meanings.length === 0) {
      throw new Error(`Missing meanings for id ${item.id}.`);
    }

    if (item.object !== "radical" && (!Array.isArray(item.data.readings) || item.data.readings.length === 0)) {
      throw new Error(`Missing readings for id ${item.id}.`);
    }
  }
}

function buildCollection() {
  const data = [];
  let id = 1;
  let lessonPosition = 1;

  for (const levelDef of LEVEL_DEFINITIONS) {
    for (const radical of levelDef.radicals) {
      data.push(
        makeCollectionItem({
          id: id++,
          level: levelDef.level,
          type: "radical",
          item: radical,
          lessonPosition: lessonPosition++,
        })
      );
    }

    for (const kanji of levelDef.kanji) {
      data.push(
        makeCollectionItem({
          id: id++,
          level: levelDef.level,
          type: "kanji",
          item: kanji,
          lessonPosition: lessonPosition++,
        })
      );
    }

    for (const vocabulary of levelDef.vocabulary) {
      data.push(
        makeCollectionItem({
          id: id++,
          level: levelDef.level,
          type: "vocabulary",
          item: vocabulary,
          lessonPosition: lessonPosition++,
        })
      );
    }
  }

  const collection = {
    object: "collection",
    url: "local://wanikani-massive-dump",
    pages: {
      per_page: data.length,
      next_url: null,
      previous_url: null,
    },
    total_count: data.length,
    data_updated_at: DATA_UPDATED_AT,
    data,
  };

  validateCollection(collection);
  return collection;
}

function buildSummary(collection) {
  return collection.data.reduce(
    (summary, item) => {
      summary.byType[item.object] += 1;
      summary.byLevel[item.data.level] += 1;
      return summary;
    },
    {
      byType: { radical: 0, kanji: 0, vocabulary: 0 },
      byLevel: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    }
  );
}

function main() {
  const collection = buildCollection();
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(collection, null, 2)}\n`, "utf8");

  const summary = buildSummary(collection);
  console.log(`Generated ${collection.total_count} subjects.`);
  console.log(`Saved file: ${OUTPUT_PATH}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
