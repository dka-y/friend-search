# use stack for search history

class SearchHistoryStack:
    def __init__ (self, max_size: int = 20):
        self._stack: list[str] = []
        self.max_size = max_size
    # add search query
    def push( self, query: str) -> None:
        if self._stack and self._stack [-1] == query:
            return
        if len(self._stack) > self.max_size:
            self._stack.pop(0)
        self._stack.append(query)
    # undo last search
    def pop (self) -> str | None:
        return self._stack.pop() if self._stack else None
    
    # return recent query
    def peek(self) -> str | None:
        return self._stack[-1] if self._stack else None

    # return history
    def get_all(self) -> str | None:
        return list(self._stack)

    def clear (self) -> None:
        self._stack.clear()

    def __len__ (self):
        return len(self._stack)
    

    