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

# Binary search

def binary_search(sorted_arr: list, target, key=None) -> int:
    lo, hi = 0, len(sorted_arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        val = key(sorted_arr[mid]) if key else sorted_arr[mid]
        if val == target:
            return mid
        elif val < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
 
 
def binary_search_prefix(sorted_usernames: list[str], prefix: str) -> int:
    lo, hi = 0, len(sorted_usernames)
    while lo < hi:
        mid = (lo + hi) // 2
        if sorted_usernames[mid] < prefix:
            lo = mid + 1
        else:
            hi = mid
    return lo
 
 
def sort_users_by_name(users: list[dict]) -> list[dict]:
    return merge_sort(users, key=lambda u: u.get("display_name", "").lower())
 
 
def sort_users_by_mutual(users: list[dict]) -> list[dict]:
    return merge_sort(users, key=lambda u: -u.get("mutual_friends", 0)) 

