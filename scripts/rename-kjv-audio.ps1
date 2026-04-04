param(
  [Parameter(Mandatory = $true)]
  [string]$SourceDir,

  [Parameter(Mandatory = $true)]
  [string]$OutputDir,

  [switch]$MoveFiles
)

$ErrorActionPreference = "Stop"

$bookMap = @{
  "Genesis" = "genesis"
  "Exodus" = "exodus"
  "Leviticus" = "leviticus"
  "Numbers" = "numbers"
  "Deuteronomy" = "deuteronomy"
  "Joshua" = "joshua"
  "Judges" = "judges"
  "Ruth" = "ruth"
  "1Samuel" = "1-samuel"
  "2Samuel" = "2-samuel"
  "1Kings" = "1-kings"
  "2Kings" = "2-kings"
  "1Chronicles" = "1-chronicles"
  "2Chronicles" = "2-chronicles"
  "Ezra" = "ezra"
  "Nehemiah" = "nehemiah"
  "Esther" = "esther"
  "Job" = "job"
  "Psalms" = "psalms"
  "Proverbs" = "proverbs"
  "Ecclesiastes" = "ecclesiastes"
  "SongofSolomon" = "song-of-solomon"
  "Isaiah" = "isaiah"
  "Jeremiah" = "jeremiah"
  "Lamentations" = "lamentations"
  "Ezekiel" = "ezekiel"
  "Daniel" = "daniel"
  "Hosea" = "hosea"
  "Joel" = "joel"
  "Amos" = "amos"
  "Obadiah" = "obadiah"
  "Jonah" = "jonah"
  "Micah" = "micah"
  "Nahum" = "nahum"
  "Habakkuk" = "habakkuk"
  "Zephaniah" = "zephaniah"
  "Haggai" = "haggai"
  "Zechariah" = "zechariah"
  "Malachi" = "malachi"
  "Matthew" = "matthew"
  "Mark" = "mark"
  "Luke" = "luke"
  "John" = "john"
  "Acts" = "acts"
  "Romans" = "romans"
  "1Corinthians" = "1-corinthians"
  "2Corinthians" = "2-corinthians"
  "Galatians" = "galatians"
  "Ephesians" = "ephesians"
  "Philippians" = "philippians"
  "Colossians" = "colossians"
  "1Thessalonians" = "1-thessalonians"
  "2Thessalonians" = "2-thessalonians"
  "1Timothy" = "1-timothy"
  "2Timothy" = "2-timothy"
  "Titus" = "titus"
  "Philemon" = "philemon"
  "Hebrews" = "hebrews"
  "James" = "james"
  "1Peter" = "1-peter"
  "2Peter" = "2-peter"
  "1John" = "1-john"
  "2John" = "2-john"
  "3John" = "3-john"
  "Jude" = "jude"
  "Revelation" = "revelation"
}

$sourcePath = (Resolve-Path -LiteralPath $SourceDir).Path
if (-not (Test-Path -LiteralPath $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir | Out-Null
}
$outputPath = (Resolve-Path -LiteralPath $OutputDir).Path

$files = Get-ChildItem -LiteralPath $sourcePath -File -Filter *.mp3
$renamed = 0
$skipped = @()

foreach ($file in $files) {
  if ($file.BaseName -notmatch '^\d{2}_(.+?)(\d{3})$') {
    $skipped += $file.Name
    continue
  }

  $rawBook = $Matches[1].Replace("_", "")
  $chapter = $Matches[2]

  if (-not $bookMap.ContainsKey($rawBook)) {
    $skipped += $file.Name
    continue
  }

  $bookSlug = $bookMap[$rawBook]
  $targetDir = Join-Path $outputPath $bookSlug
  if (-not (Test-Path -LiteralPath $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir | Out-Null
  }

  $targetPath = Join-Path $targetDir "$chapter.mp3"
  if ($MoveFiles) {
    Move-Item -LiteralPath $file.FullName -Destination $targetPath -Force
  } else {
    Copy-Item -LiteralPath $file.FullName -Destination $targetPath -Force
  }
  $renamed += 1
}

Write-Output "Prepared $renamed KJV files in $outputPath"
if ($skipped.Count -gt 0) {
  Write-Output ""
  Write-Output "Skipped files:"
  $skipped | ForEach-Object { Write-Output " - $_" }
}
