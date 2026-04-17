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
  }
];

const ELHB_HYMN_GUIDE_MAP = new Map(
  ELHB_HYMN_GUIDE.map((entry) => [entry.observanceKey, entry])
);

export function findElhbGuideEntryByKey(key) {
  return ELHB_HYMN_GUIDE_MAP.get(key) || null;
}
