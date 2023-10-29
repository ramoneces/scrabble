# Load definitions.json into an object
$definitions = Get-Content -Path definitions.json | ConvertFrom-Json

# Read lexicon.es.txt into a variable and iterate line by line adding the definition to each word found
$lexicon = Get-Content -Path lexicon.es.txt

$newLines = @()

foreach ($line in $lexicon) {
    # Split the line by tab
    $lineParts = $line.Split("`t")

    # Get the word
    $word = $lineParts[0]

    # Get the definition
    $wordDefinitions = $definitions.$word.definitions      

    if($null -ne $wordDefinitions) {
        # Replace the definition in the line
        $line = "$word`t$($wordDefinitions[0])"
    }

    # Add the line to the array
    $newLines += $line
}

# Create empty output file
$newLines | Out-File -FilePath lexicon.es.2.txt -Encoding Default