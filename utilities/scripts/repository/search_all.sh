for file in $1
	do
		if grep -q "$2" "$file"; then
			echo ""
			echo $file
			cat $file | grep $2
		fi
done
