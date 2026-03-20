# use merge sort and binary search 
# sorting autocomplete suggestion
# binary search on sorted username list 

# merge

def merge_sort(arr: list, key=None) -> list:
    if len(arr) <= 1:
        return arr
    mid = len(arr)//2
    left = merge_sort(arr[:mid], key=key)
    right = merge_sort(arr[mid:], key = key)
    return _merge(left,right,key)

    def _merge(left: list, right: list, key) -> list:
        result = []
        i = j = 0
        while i < len(left) and j < len(right):
            lv = key (left[i] if key else left[i])
            rv = key(right[j] if key else right[j])

            if lv <= rv:
                result.append(left[i])
                i+=1
            else:
                result.append(right[j])
                j+=1

        result.extend(left[i:])
        result.extend(right[j:])
        return result

