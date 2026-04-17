export const ELHB_HYMN_GUIDE = [
  {
    id: "advent_1",
    observanceKey: "advent-1",
    name: "First Sunday in Advent",
    season: "Advent",
    color: "Violet",
    lectionary: {
      introit: "Psalm 24:7-10",
      collect: "Stir up Thy power, O Lord, and come",
      epistle: "Romans 13:11-14",
      gospel: "Matthew 21:1-9"
    },
    hymns: {
      entrance: { number: 90, title: "The advent of our King" },
      chief: { number: 95, title: "Savior of the nations, come" },
      distribution: { number: 94, title: "Come, Thou precious Ransom, come" },
      closing: { number: 91, title: "Lift up your heads, ye mighty gates" }
    },
    notes: [
      "Chief hymn precedes the sermon.",
      "Use all stanzas of ELHB 95."
    ]
  },
  {
    id: "christmas_day",
    observanceKey: "christmas-day",
    name: "Christmas Day",
    season: "Christmas",
    color: "White",
    lectionary: {
      introit: "Psalm 98",
      collect: "Grant, we beseech Thee, Almighty God",
      epistle: "Titus 2:11-14",
      gospel: "Luke 2:1-14"
    },
    hymns: {
      entrance: { number: 80, title: "All praise to Thee, eternal God" },
      chief: { number: 85, title: "From heaven above to earth I come" },
      distribution: { number: 81, title: "Oh, come, all ye faithful" },
      closing: { number: 84, title: "Hark! the herald angels sing" }
    },
    notes: [
      "Festival setting.",
      "All stanzas of the chief hymn are preferred."
    ]
  },
  {
    id: "ash_wednesday",
    observanceKey: "ash-wednesday",
    name: "Ash Wednesday",
    season: "Lent",
    color: "Violet",
    lectionary: {
      introit: "Psalm 51",
      collect: "Almighty and everlasting God",
      epistle: "Joel 2:12-19",
      gospel: "Matthew 6:16-21"
    },
    hymns: {
      entrance: { number: 325, title: "From depths of woe I cry to Thee" },
      chief: { number: 321, title: "Jesus, I will ponder now" },
      distribution: { number: 330, title: "I lay my sins on Jesus" },
      closing: { number: 331, title: "Rock of Ages, cleft for me" }
    },
    notes: [
      "No Gloria.",
      "No Alleluia.",
      "Keep a penitential tone throughout."
    ]
  },
  {
    id: "good_friday",
    observanceKey: "good-friday",
    name: "Good Friday",
    season: "Lent",
    color: "Black",
    lectionary: {
      introit: "Psalm 22",
      collect: "Almighty God, we beseech Thee graciously to behold",
      gospel: "John 18-19"
    },
    hymns: {
      entrance: { number: 168, title: "Stricken, smitten, and afflicted" },
      chief: { number: 172, title: "O sacred Head, now wounded" },
      distribution: { number: 171, title: "Upon the cross extended" },
      closing: { number: 175, title: "When I survey the wondrous cross" }
    },
    notes: [
      "Silence after the service.",
      "Use Passion hymns only."
    ]
  },
  {
    id: "easter",
    observanceKey: "easter",
    name: "Easter Sunday",
    season: "Easter",
    color: "White",
    lectionary: {
      introit: "Psalm 118",
      collect: "Almighty God, who through Thine only-begotten Son",
      epistle: "1 Corinthians 5:6-8",
      gospel: "Mark 16:1-8"
    },
    hymns: {
      entrance: { number: 187, title: "Jesus Christ is risen today" },
      chief: { number: 191, title: "Awake, my heart, with gladness" },
      distribution: { number: 193, title: "Alleluia! Jesus lives!" },
      closing: { number: 190, title: "He is arisen! Glorious Word!" }
    },
    notes: [
      "Alleluia is restored.",
      "Use the festival setting."
    ]
  },
  {
    id: "pentecost",
    observanceKey: "pentecost",
    name: "Pentecost",
    season: "Pentecost",
    color: "Red",
    lectionary: {
      introit: "Psalm 68",
      collect: "O God, who didst teach the hearts of Thy faithful people",
      epistle: "Acts 2:1-13",
      gospel: "John 14:23-31"
    },
    hymns: {
      entrance: { number: 226, title: "Come, Thou Holy Spirit, come" },
      chief: { number: 224, title: "Come, Holy Ghost, Creator blest" },
      distribution: { number: 228, title: "O Spirit of life, O Spirit of God" },
      closing: { number: 289, title: "Thy strong word did cleave the darkness" }
    },
    notes: []
  },
  {
    id: "trinity",
    observanceKey: "trinity-sunday",
    name: "Holy Trinity",
    season: "Trinity",
    color: "White",
    lectionary: {
      introit: "Psalm 8",
      collect: "Almighty and everlasting God",
      epistle: "Romans 11:33-36",
      gospel: "John 3:1-15"
    },
    hymns: {
      entrance: { number: 246, title: "Come, Thou almighty King" },
      chief: { number: 247, title: "Holy, holy, holy! Lord God Almighty" },
      distribution: { number: 248, title: "Holy God, we praise Thy name" },
      closing: { number: 250, title: "O blessed, holy Trinity" }
    },
    notes: []
  },
  {
    id: "trinity_1",
    observanceKey: "trinity-1",
    name: "First Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 473, title: "The Church's one foundation" },
      chief: { number: 385, title: "O love, how deep, how broad, how high" },
      distribution: { number: 429, title: "Lord, Thee I love with all my heart" },
      closing: { number: 611, title: "The day is surely drawing near" }
    },
    notes: []
  },
  {
    id: "trinity_2",
    observanceKey: "trinity-2",
    name: "Second Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 306, title: "Jesus Christ, our blessed Savior" },
      chief: { number: 305, title: "Soul, adorn thyself with gladness" },
      distribution: { number: 308, title: "O Lord, we praise Thee" },
      closing: { number: 307, title: "Draw nigh and take the body of the Lord" }
    },
    notes: []
  },
  {
    id: "trinity_3",
    observanceKey: "trinity-3",
    name: "Third Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 324, title: "Just as I am, without one plea" },
      chief: { number: 330, title: "I lay my sins on Jesus" },
      distribution: { number: 331, title: "Rock of Ages, cleft for me" },
      closing: { number: 377, title: "Salvation unto us has come" }
    },
    notes: []
  },
  {
    id: "trinity_4",
    observanceKey: "trinity-4",
    name: "Fourth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 422, title: "I heard the voice of Jesus say" },
      chief: { number: 421, title: "Jesus calls us o'er the tumult" },
      distribution: { number: 424, title: "Take my life and let it be" },
      closing: { number: 426, title: "O God, my faithful God" }
    },
    notes: []
  },
  {
    id: "trinity_5",
    observanceKey: "trinity-5",
    name: "Fifth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 520, title: "Jesus, Savior, pilot me" },
      chief: { number: 429, title: "Lord, Thee I love with all my heart" },
      distribution: { number: 523, title: "If God Himself be for me" },
      closing: { number: 524, title: "How firm a foundation, ye saints of the Lord" }
    },
    notes: []
  },
  {
    id: "trinity_6",
    observanceKey: "trinity-6",
    name: "Sixth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 298, title: "All who believe and are baptized" },
      chief: { number: 299, title: "Baptized into Thy name most holy" },
      distribution: { number: 302, title: "God's own child, I gladly say it" },
      closing: { number: 377, title: "Salvation unto us has come" }
    },
    notes: []
  },
  {
    id: "trinity_7",
    observanceKey: "trinity-7",
    name: "Seventh Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 25, title: "Praise to the Lord, the Almighty" },
      chief: { number: 522, title: "God moves in a mysterious way" },
      distribution: { number: 523, title: "If God Himself be for me" },
      closing: { number: 524, title: "How firm a foundation, ye saints of the Lord" }
    },
    notes: []
  },
  {
    id: "trinity_8",
    observanceKey: "trinity-8",
    name: "Eighth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 261, title: "Lord, keep us steadfast in Thy Word" },
      chief: { number: 289, title: "Thy strong word did cleave the darkness" },
      distribution: { number: 288, title: "O God, our Lord, Thy holy Word" },
      closing: { number: 473, title: "The Church's one foundation" }
    },
    notes: []
  },
  {
    id: "trinity_9",
    observanceKey: "trinity-9",
    name: "Ninth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 424, title: "Take my life and let it be" },
      chief: { number: 426, title: "O God, my faithful God" },
      distribution: { number: 422, title: "I heard the voice of Jesus say" },
      closing: { number: 523, title: "If God Himself be for me" }
    },
    notes: []
  },
  {
    id: "trinity_10",
    observanceKey: "trinity-10",
    name: "Tenth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 473, title: "The Church's one foundation" },
      chief: { number: 261, title: "Lord, keep us steadfast in Thy Word" },
      distribution: { number: 289, title: "Thy strong word did cleave the darkness" },
      closing: { number: 611, title: "The day is surely drawing near" }
    },
    notes: []
  },
  {
    id: "trinity_11",
    observanceKey: "trinity-11",
    name: "Eleventh Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 377, title: "Salvation unto us has come" },
      chief: { number: 372, title: "By grace I'm saved, grace free and boundless" },
      distribution: { number: 373, title: "Not what these hands have done" },
      closing: { number: 380, title: "Thy works, not mine, O Christ" }
    },
    notes: []
  },
  {
    id: "trinity_12",
    observanceKey: "trinity-12",
    name: "Twelfth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 289, title: "Thy strong word did cleave the darkness" },
      chief: { number: 288, title: "O God, our Lord, Thy holy Word" },
      distribution: { number: 290, title: "Lord, keep us steadfast in Thy Word" },
      closing: { number: 261, title: "Lord, keep us steadfast in Thy Word" }
    },
    notes: []
  },
  {
    id: "trinity_13",
    observanceKey: "trinity-13",
    name: "Thirteenth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 385, title: "O love, how deep, how broad, how high" },
      chief: { number: 429, title: "Lord, Thee I love with all my heart" },
      distribution: { number: 424, title: "Take my life and let it be" },
      closing: { number: 426, title: "O God, my faithful God" }
    },
    notes: []
  },
  {
    id: "trinity_14",
    observanceKey: "trinity-14",
    name: "Fourteenth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 523, title: "If God Himself be for me" },
      chief: { number: 522, title: "God moves in a mysterious way" },
      distribution: { number: 524, title: "How firm a foundation, ye saints of the Lord" },
      closing: { number: 520, title: "Jesus, Savior, pilot me" }
    },
    notes: []
  },
  {
    id: "trinity_15",
    observanceKey: "trinity-15",
    name: "Fifteenth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 522, title: "God moves in a mysterious way" },
      chief: { number: 523, title: "If God Himself be for me" },
      distribution: { number: 524, title: "How firm a foundation, ye saints of the Lord" },
      closing: { number: 520, title: "Jesus, Savior, pilot me" }
    },
    notes: []
  },
  {
    id: "trinity_16",
    observanceKey: "trinity-16",
    name: "Sixteenth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 611, title: "The day is surely drawing near" },
      chief: { number: 331, title: "Rock of Ages, cleft for me" },
      distribution: { number: 522, title: "God moves in a mysterious way" },
      closing: { number: 524, title: "How firm a foundation, ye saints of the Lord" }
    },
    notes: []
  },
  {
    id: "trinity_17",
    observanceKey: "trinity-17",
    name: "Seventeenth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 429, title: "Lord, Thee I love with all my heart" },
      chief: { number: 377, title: "Salvation unto us has come" },
      distribution: { number: 372, title: "By grace I'm saved, grace free and boundless" },
      closing: { number: 380, title: "Thy works, not mine, O Christ" }
    },
    notes: []
  },
  {
    id: "trinity_18",
    observanceKey: "trinity-18",
    name: "Eighteenth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 385, title: "O love, how deep, how broad, how high" },
      chief: { number: 424, title: "Take my life and let it be" },
      distribution: { number: 429, title: "Lord, Thee I love with all my heart" },
      closing: { number: 426, title: "O God, my faithful God" }
    },
    notes: []
  },
  {
    id: "trinity_19",
    observanceKey: "trinity-19",
    name: "Nineteenth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 372, title: "By grace I'm saved, grace free and boundless" },
      chief: { number: 373, title: "Not what these hands have done" },
      distribution: { number: 377, title: "Salvation unto us has come" },
      closing: { number: 380, title: "Thy works, not mine, O Christ" }
    },
    notes: []
  },
  {
    id: "trinity_20",
    observanceKey: "trinity-20",
    name: "Twentieth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 95, title: "Savior of the nations, come" },
      chief: { number: 473, title: "The Church's one foundation" },
      distribution: { number: 289, title: "Thy strong word did cleave the darkness" },
      closing: { number: 288, title: "O God, our Lord, Thy holy Word" }
    },
    notes: []
  },
  {
    id: "trinity_21",
    observanceKey: "trinity-21",
    name: "Twenty-first Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 524, title: "How firm a foundation, ye saints of the Lord" },
      chief: { number: 520, title: "Jesus, Savior, pilot me" },
      distribution: { number: 522, title: "God moves in a mysterious way" },
      closing: { number: 523, title: "If God Himself be for me" }
    },
    notes: []
  },
  {
    id: "trinity_22",
    observanceKey: "trinity-22",
    name: "Twenty-second Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 330, title: "I lay my sins on Jesus" },
      chief: { number: 331, title: "Rock of Ages, cleft for me" },
      distribution: { number: 377, title: "Salvation unto us has come" },
      closing: { number: 373, title: "Not what these hands have done" }
    },
    notes: []
  },
  {
    id: "trinity_23",
    observanceKey: "trinity-23",
    name: "Twenty-third Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 609, title: "Wake, awake, for night is flying" },
      chief: { number: 610, title: "Lo! He comes, with clouds descending" },
      distribution: { number: 611, title: "The day is surely drawing near" },
      closing: { number: 523, title: "If God Himself be for me" }
    },
    notes: []
  },
  {
    id: "trinity_24",
    observanceKey: "trinity-24",
    name: "Twenty-fourth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 611, title: "The day is surely drawing near" },
      chief: { number: 609, title: "Wake, awake, for night is flying" },
      distribution: { number: 610, title: "Lo! He comes, with clouds descending" },
      closing: { number: 522, title: "God moves in a mysterious way" }
    },
    notes: []
  },
  {
    id: "trinity_25",
    observanceKey: "trinity-25",
    name: "Twenty-fifth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 523, title: "If God Himself be for me" },
      chief: { number: 524, title: "How firm a foundation, ye saints of the Lord" },
      distribution: { number: 611, title: "The day is surely drawing near" },
      closing: { number: 520, title: "Jesus, Savior, pilot me" }
    },
    notes: []
  },
  {
    id: "trinity_26",
    observanceKey: "trinity-26",
    name: "Twenty-sixth Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 610, title: "Lo! He comes, with clouds descending" },
      chief: { number: 611, title: "The day is surely drawing near" },
      distribution: { number: 609, title: "Wake, awake, for night is flying" },
      closing: { number: 522, title: "God moves in a mysterious way" }
    },
    notes: []
  },
  {
    id: "trinity_27",
    observanceKey: "trinity-27",
    name: "Twenty-seventh Sunday after Trinity",
    season: "Trinity",
    color: "Green",
    lectionary: {},
    hymns: {
      entrance: { number: 611, title: "The day is surely drawing near" },
      chief: { number: 609, title: "Wake, awake, for night is flying" },
      distribution: { number: 610, title: "Lo! He comes, with clouds descending" },
      closing: { number: 524, title: "How firm a foundation, ye saints of the Lord" }
    },
    notes: []
  }
];

const ELHB_HYMN_GUIDE_MAP = new Map(
  ELHB_HYMN_GUIDE.map((entry) => [entry.observanceKey, entry])
);

export function findElhbGuideEntryByKey(key) {
  return ELHB_HYMN_GUIDE_MAP.get(key) || null;
}
