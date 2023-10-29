<# 
.DESCRIPTION 
This script reads the RAE dictionary XHTML files and extracts the information about the words and their definitions to a JSON file.
#>

function NormalizeWord {
    param (
        [Parameter(Mandatory=$true)]
        [string]$InputString
    )

    # Sustituir tildes
    $transformedString = $InputString -replace 'á', 'a' -replace 'é', 'e' -replace 'í', 'i' -replace 'ó', 'o' -replace 'ú', 'u' -replace 'ü', 'u'

    # Convertir a mayúsculas
    $transformedString = $transformedString.ToUpper()

    # Sustituir 'CH', 'LL' y 'RR'
    $transformedString = $transformedString -replace 'CH', '1' -replace 'LL', '2' -replace 'RR', '3'

    return $transformedString
}

function GetDefinitions($definition) {  
    # Encuentra todas las ocurrencias de patrones como '1.', '2.', etc.
    $matchResults = [regex]::Matches($definition, '\d+\.')

    # Inicializa un array para almacenar las subcadenas
    $substrings = @()

    # Recorre cada coincidencia
    for ($i = 0; $i -lt $matchResults.Count; $i++) {
        # Encuentra la posición de inicio y fin de la subcadena
        $startPos = $matchResults[$i].Index + $matchResults[$i].Length
        if ($i -lt $matchResults.Count - 1) {
            $endPos = $matchResults[$i + 1].Index
        } else {
            $endPos = $definition.Length
        }

        # Extrae la subcadena
        $substring = $definition.Substring($startPos, $endPos - $startPos)
        

        # Añade la subcadena al array
        $substrings += $substring.Trim()        
    }

    return , $substrings
}

function GetWordGenders ($inputString) {
    $results = @()
    
    $synonyms = $inputString -split ' o '

    foreach ($synonym in $synonyms) {
        $genders = $synonym -split ', '

        if(1 -eq $genders.Count) {
            return @($genders[0])
        }

        $gender1 = $genders[0]

        $results += $gender1

        for ($i = 1; $i -lt $genders.Count; $i++) {
            $gender2Ending = $genders[$i]

            if($gender2Ending.Length -ge $gender1.Length) {
                $results += $gender2Ending
            }
            else{
                if($gender2Ending.Length -eq 1) {
                    $index = $gender1.Length - 1
                }
                else{
                    $index = $gender1.LastIndexOf($gender2Ending[0])
                }
                $results += $gender1.Substring(0, $index) + $gender2Ending
            }
        }
    }

    return $results
}

# Crear un objeto json para guardar las palabras y definiciones indexadas por la palabra normalizada
$dictionary = @{}

# Contar los ficheros .xhtml del directorio actual cuyo nombre empiece por 'RAEv15_' y despuĂŠs recorrerlos
$files = Get-ChildItem -Path ".\OEBPS\Text" -Filter 'RAEv15_*.xhtml'
$filesCount = $files.Count

# Inicializar contador de palabras
$wordsCount = 0

$files | ForEach-Object {
    $fileName = $_.Name

    # Cargar el documento XML
    [xml]$xmlDoc = Get-Content $_.FullName

    # Crear un objeto XmlNamespaceManager para manejar el espacio de nombres
    $nsManager = New-Object System.Xml.XmlNamespaceManager($xmlDoc.NameTable)
    $nsManager.AddNamespace('ns', 'http://www.w3.org/1999/xhtml')

    # Buscar todas las etiquetas <p> con clase 'asangre'
    $pTags = $xmlDoc.SelectNodes('//ns:p[@class="asangre"]', $nsManager)

    foreach ($tag in $pTags) {
        # Buscar la etiqueta <b> con clase 'masnegrita' dentro de la etiqueta <p>
        $wordTag = $tag.SelectSingleNode('ns:b[@class="masnegrita"]', $nsManager)

        try {
            # Si la etiqueta es null, no hay nada que hacer
            if($null -eq $wordTag) {
                continue
            }

            # Guardar el texto de la etiqueta <b> en $word
            $word = $wordTag.'#text'.TrimEnd('.')

            # Si la palabra es un sufijo o prefijo
            if($word.StartsWith('-') -or $word.EndsWith('-')) {
                continue
            }   

            # Guardar el resto del texto de la etiqueta <p> en $definition
            $definition = $tag.InnerText.Replace($word, '').Trim()

            # Obtener la primera definición
            $definitions = GetDefinitions($definition)   
            
            $genderWords = GetWordGenders($word)

            # Si la palabra contiene espacio pero no se debe a doble género, no se procesa
            if($word.Contains(' ') -and $genderWords.Count -eq 1) {
                continue
            }        

            foreach ($genderWord in $genderWords) {
                # Normalizar la palabra
                $normalizedWord = NormalizeWord $genderWord

                # Crear un objeto json con la palabra y la definición
                $dictionary[$normalizedWord] = @{
                    word = $genderWord
                    definition = $definition
                    definitions = $definitions
                }

                # Incrementar el contador de palabras
                $wordsCount++
            }
            
        }
        catch {
            # Loguear nombre de fichero RAE y palabra
            Write-Host "Fallo en $fileName, tag: $($wordTag.'#text')"
            Write-Host $_.Exception.Message -ForegroundColor Red 
            Write-Host $_.Exception.StackTrace -ForegroundColor Red
        }
    }

    # Imprimir el procentaje de ficheros procesados
    $filesCount--
    Write-Progress -Activity 'Extrayendo definiciones' -Status $_.Name -PercentComplete (($filesCount / $files.Count) * 100)

}

# Convertir el array json en una cadena json
$jsonString = $dictionary | ConvertTo-Json

# Guardar la cadena json en un fichero respetando la codficación española
$jsonString | Out-File -FilePath 'definitions.json' -Encoding Default

# Imprimir el número de palabras y extraĂ­das
Write-Host "Se han extraído $wordsCount palabras"

# Abrir el fichero
Invoke-Item 'definitions.json'
