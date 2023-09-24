class TrieNode {
    constructor() {
      this.children = new Map();
      this.isEndOfWord = false;
    }
  }
  
  class Trie {
    constructor() {
      this.root = new TrieNode();
    }
  
    insert(word) {
      let currentNode = this.root;
  
      for (const char of word) {
        if (!currentNode.children.has(char)) {
          currentNode.children.set(char, new TrieNode());
        }
        currentNode = currentNode.children.get(char);
      }
  
      currentNode.isEndOfWord = true;
    }
  
    search(word) {
      let currentNode = this.root;
  
      for (const char of word) {
        if (!currentNode.children.has(char)) {
          return false;
        }
        currentNode = currentNode.children.get(char);
      }
  
      return currentNode.isEndOfWord;
    }
  }
  

module.exports =  Trie;
  