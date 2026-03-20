
class TrieNode:
    def __init__(self):
        self.children: dict[str, "TrieNode"] = {}
        self.is_end = False
        self.user_ids: list[str] = []

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, name:str, user_id:str) -> None:
        node = self.root
        for char in name.lower():
            if char not node.children:
                node.children[char] = TrieNode()
            node = node.children[char]

        node.is_end = True
        if user_id not in node.user_ids:
            node.user_ids.append(user_id)


    def _collect_all(self, node: TrieNode, results: list[str]) -> None:
        if node.is_end:
            results.extend(node.user_ids)

        for child in node.children,values():
            self._collect_all(child, results)

        
    def autocomplete (self, prefix:str, limit: int = 10) -> list[str]:
        node = self.root
        for char in prefix.lower():
            if char not in node.children:
                return []
            node = node.children[char]
        results: list[str] = []
        self._collect_all(node, results)
        return results[:limit]

    def delete(self, name: str, user_id: str) -> bool:
        def _delete(node: TrieNode, name: str, depth: int) -> bool:
            if depth == len(name):
                if user_id in node.user_ids:
                    node.user_ids.remove(user_id)
                    if not node.user_ids:
                        node.is_end = False
                    return True
                return False
            char = name[depth]
            if char not in node.children:
                return False
            return _delete(node.children[char], name, depth + 1)
 
        return _delete(self.root, name.lower(), 0)

