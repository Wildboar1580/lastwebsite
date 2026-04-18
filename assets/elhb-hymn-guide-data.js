const ELHB_HYMN_GUIDE_CORE = [
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

const ELHB_HYMN_GUIDE_PLACEHOLDERS = [
  { id: "advent_2", observanceKey: "advent-2", name: "Second Sunday in Advent", season: "Advent", color: "Violet" },
  { id: "advent_3", observanceKey: "advent-3", name: "Third Sunday in Advent", season: "Advent", color: "Violet" },
  { id: "advent_4", observanceKey: "advent-4", name: "Fourth Sunday in Advent", season: "Advent", color: "Violet" },
  { id: "christmas_eve", observanceKey: "christmas-eve", name: "Christmas Eve", season: "Christmas", color: "White" },
  { id: "sunday_after_christmas", observanceKey: "sunday-after-christmas", name: "Sunday after Christmas", season: "Christmas", color: "White" },
  { id: "sunday_after_new_years", observanceKey: "sunday-after-new-years", name: "Sunday after New Year’s", season: "Christmas", color: "White" },
  { id: "baptism_of_our_lord", observanceKey: "baptism-of-our-lord", name: "The Baptism of Our Lord", season: "Epiphany", color: "White" },
  { id: "epiphany", observanceKey: "epiphany", name: "The Epiphany of Our Lord", season: "Epiphany", color: "White" },
  { id: "epiphany_2", observanceKey: "epiphany-2", name: "Second Sunday after Epiphany", season: "Epiphany", color: "Green" },
  { id: "epiphany_3", observanceKey: "epiphany-3", name: "Third Sunday after Epiphany", season: "Epiphany", color: "Green" },
  { id: "epiphany_4", observanceKey: "epiphany-4", name: "Fourth Sunday after Epiphany", season: "Epiphany", color: "Green" },
  { id: "epiphany_5", observanceKey: "epiphany-5", name: "Fifth Sunday after Epiphany", season: "Epiphany", color: "Green" },
  { id: "transfiguration", observanceKey: "transfiguration", name: "Transfiguration", season: "Epiphany", color: "White" },
  { id: "septuagesima", observanceKey: "septuagesima", name: "Septuagesima", season: "Pre-Lent", color: "Green" },
  { id: "sexagesima", observanceKey: "sexagesima", name: "Sexagesima", season: "Pre-Lent", color: "Green" },
  { id: "quinquagesima", observanceKey: "quinquagesima", name: "Quinquagesima", season: "Pre-Lent", color: "Green" },
  { id: "lent_1", observanceKey: "lent-1", name: "First Sunday in Lent", season: "Lent", color: "Violet" },
  { id: "lent_2", observanceKey: "lent-2", name: "Second Sunday in Lent", season: "Lent", color: "Violet" },
  { id: "lent_3", observanceKey: "lent-3", name: "Third Sunday in Lent", season: "Lent", color: "Violet" },
  { id: "lent_4", observanceKey: "lent-4", name: "Fourth Sunday in Lent", season: "Lent", color: "Rose" },
  { id: "lent_5", observanceKey: "lent-5", name: "Fifth Sunday in Lent", season: "Lent", color: "Violet" },
  { id: "palm_sunday", observanceKey: "palm-sunday", name: "Palm Sunday", season: "Holy Week", color: "Violet" },
  { id: "holy_week_monday", observanceKey: "holy-week-monday", name: "Monday of Holy Week", season: "Holy Week", color: "Violet" },
  { id: "holy_week_tuesday", observanceKey: "holy-week-tuesday", name: "Tuesday of Holy Week", season: "Holy Week", color: "Violet" },
  { id: "holy_week_wednesday", observanceKey: "holy-week-wednesday", name: "Wednesday of Holy Week", season: "Holy Week", color: "Violet" },
  { id: "maundy_thursday", observanceKey: "maundy-thursday", name: "Maundy Thursday", season: "Holy Week", color: "White" },
  { id: "holy_saturday", observanceKey: "holy-saturday", name: "Holy Saturday", season: "Holy Week", color: "Black" },
  { id: "easter_monday", observanceKey: "easter-monday", name: "Easter Monday", season: "Easter", color: "White" },
  { id: "easter_tuesday", observanceKey: "easter-tuesday", name: "Easter Tuesday", season: "Easter", color: "White" },
  { id: "easter_wednesday", observanceKey: "easter-wednesday", name: "Easter Wednesday", season: "Easter", color: "White" },
  { id: "easter_2", observanceKey: "easter-2", name: "Second Sunday of Easter", season: "Easter", color: "White" },
  { id: "easter_3", observanceKey: "easter-3", name: "Third Sunday of Easter", season: "Easter", color: "White" },
  { id: "easter_4", observanceKey: "easter-4", name: "Fourth Sunday of Easter", season: "Easter", color: "White" },
  { id: "easter_5", observanceKey: "easter-5", name: "Fifth Sunday of Easter", season: "Easter", color: "White" },
  { id: "easter_6", observanceKey: "easter-6", name: "Sixth Sunday of Easter", season: "Easter", color: "White" },
  { id: "ascension", observanceKey: "ascension", name: "Ascension", season: "Easter", color: "White" },
  { id: "exaudi", observanceKey: "exaudi", name: "Exaudi", season: "Easter", color: "White" },
  { id: "pentecost_monday", observanceKey: "pentecost-monday", name: "Pentecost Monday", season: "Pentecost", color: "Red" },
  { id: "pentecost_tuesday", observanceKey: "pentecost-tuesday", name: "Pentecost Tuesday", season: "Pentecost", color: "Red" },
  { id: "third_last_sunday", observanceKey: "third-last-sunday", name: "Third Last Sunday", season: "End Times", color: "Green" },
  { id: "second_last_sunday", observanceKey: "second-last-sunday", name: "Second Last Sunday", season: "End Times", color: "Green" },
  { id: "last_sunday", observanceKey: "last-sunday", name: "Last Sunday", season: "End Times", color: "Green" }
];

const ELHB_HYMN_GUIDE_ORDER = [
  "advent_1", "advent_2", "advent_3", "advent_4",
  "christmas_eve", "christmas_day", "sunday_after_christmas", "sunday_after_new_years",
  "baptism_of_our_lord", "epiphany", "epiphany_2", "epiphany_3", "epiphany_4", "epiphany_5", "transfiguration",
  "septuagesima", "sexagesima", "quinquagesima",
  "ash_wednesday", "lent_1", "lent_2", "lent_3", "lent_4", "lent_5", "palm_sunday",
  "holy_week_monday", "holy_week_tuesday", "holy_week_wednesday", "maundy_thursday", "good_friday", "holy_saturday",
  "easter", "easter_monday", "easter_tuesday", "easter_wednesday", "easter_2", "easter_3", "easter_4", "easter_5", "easter_6",
  "ascension", "exaudi", "pentecost", "pentecost_monday", "pentecost_tuesday",
  "trinity",
  "trinity_1", "trinity_2", "trinity_3", "trinity_4", "trinity_5", "trinity_6", "trinity_7", "trinity_8", "trinity_9",
  "trinity_10", "trinity_11", "trinity_12", "trinity_13", "trinity_14", "trinity_15", "trinity_16", "trinity_17", "trinity_18",
  "trinity_19", "trinity_20", "trinity_21", "trinity_22", "trinity_23", "trinity_24", "trinity_25", "trinity_26", "trinity_27",
  "third_last_sunday", "second_last_sunday", "last_sunday"
];

function createPlaceholderGuideEntry(entry) {
  return {
    ...entry,
    lectionary: {},
    hymns: {
      entrance: null,
      chief: null,
      distribution: null,
      closing: null
    },
    notes: []
  };
}

const guideEntryMap = new Map(
  [...ELHB_HYMN_GUIDE_CORE, ...ELHB_HYMN_GUIDE_PLACEHOLDERS.map(createPlaceholderGuideEntry)]
    .map((entry) => [entry.id, entry])
);

export const ELHB_HYMN_GUIDE = ELHB_HYMN_GUIDE_ORDER
  .map((id) => guideEntryMap.get(id))
  .filter(Boolean);

const ELHB_HYMN_GUIDE_MAP = new Map(
  ELHB_HYMN_GUIDE.map((entry) => [entry.observanceKey, entry])
);

export function findElhbGuideEntryByKey(key) {
  return ELHB_HYMN_GUIDE_MAP.get(key) || null;
}
