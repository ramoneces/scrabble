#!/bin/bash

input_file="L.txt"
output_file="output.txt"

while IFS= read -r line; do
  echo "$line" >> "$output_file"
done < "$input_file"