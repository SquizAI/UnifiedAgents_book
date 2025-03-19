/**
 * Tag-Based Filtering System for Memory Management
 * 
 * This example demonstrates advanced tag-based filtering techniques for 
 * memory systems, including hierarchical tags, dynamic tagging, and efficient filtering.
 */

class TagFilteringSystem {
  constructor(options = {}) {
    this.options = {
      enableHierarchy: true,
      enableSynonyms: true,
      caseSensitive: false,
      maxTagLength: 50,
      ...options
    };
    
    // Core data structures
    this.tagToItems = new Map(); // tag → Set of item IDs
    this.itemToTags = new Map(); // item ID → Set of tags
    
    // Hierarchical tag support
    this.tagHierarchy = new Map(); // tag → Set of child tags
    this.tagParents = new Map();   // tag → Set of parent tags
    
    // Synonyms for tags
    this.tagSynonyms = new Map(); // tag → Set of synonyms
    
    // Tag metadata
    this.tagMetadata = new Map(); // tag → metadata object
    
    // Category organization
    this.categories = new Map(); // category → Set of tags
    
    // Commonly used tag sets (cached)
    this.commonTagSets = new Map(); // name → Set of tags
    
    // Initialize default categories
    this.initializeDefaultCategories();
  }
  
  /**
   * Initialize default tag categories
   */
  initializeDefaultCategories() {
    this.addCategory('language', 'Programming language tags');
    this.addCategory('framework', 'Framework and library tags');
    this.addCategory('domain', 'Domain-specific knowledge tags');
    this.addCategory('status', 'Status and state tags');
    this.addCategory('priority', 'Priority level tags');
    this.addCategory('type', 'Content type tags');
    this.addCategory('complexity', 'Complexity level tags');
  }
  
  /**
   * Normalize tag strings based on options
   */
  normalizeTag(tag) {
    if (!tag) return '';
    
    let normalized = tag.trim();
    
    if (!this.options.caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    
    if (normalized.length > this.options.maxTagLength) {
      normalized = normalized.substring(0, this.options.maxTagLength);
    }
    
    return normalized;
  }
  
  /**
   * Add an item with associated tags
   */
  tagItem(itemId, tags, options = {}) {
    // Normalize and validate tags
    const normalizedTags = this.normalizeTags(tags);
    
    if (normalizedTags.length === 0) {
      return { success: false, message: 'No valid tags provided' };
    }
    
    // Initialize item's tag set if needed
    if (!this.itemToTags.has(itemId)) {
      this.itemToTags.set(itemId, new Set());
    }
    
    const itemTags = this.itemToTags.get(itemId);
    const addedTags = [];
    
    // Add each tag
    for (const tag of normalizedTags) {
      // Skip if item already has this tag
      if (itemTags.has(tag)) continue;
      
      // Add tag to item
      itemTags.add(tag);
      
      // Add item to tag's item set
      if (!this.tagToItems.has(tag)) {
        this.tagToItems.set(tag, new Set());
      }
      
      this.tagToItems.get(tag).add(itemId);
      addedTags.push(tag);
      
      // Apply auto-tagging if enabled
      if (options.autoTagRelated) {
        this.applyAutoTagging(itemId, tag);
      }
    }
    
    // Auto-register with tag hierarchy if parent tags are specified
    if (options.parentTags) {
      for (const parentTag of this.normalizeTags(options.parentTags)) {
        for (const tag of addedTags) {
          this.addTagToHierarchy(tag, parentTag);
        }
      }
    }
    
    return { 
      success: true, 
      itemId, 
      addedTags,
      totalTags: itemTags.size
    };
  }
  
  /**
   * Normalize an array of tags
   */
  normalizeTags(tags) {
    if (!tags) return [];
    
    // Convert string to array if needed
    if (typeof tags === 'string') {
      tags = tags.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0);
    }
    
    // Normalize each tag
    return tags.map(tag => this.normalizeTag(tag))
               .filter(tag => tag.length > 0)
               .filter((tag, index, self) => self.indexOf(tag) === index); // unique only
  }
  
  /**
   * Remove a tag from an item
   */
  removeTag(itemId, tag) {
    const normalizedTag = this.normalizeTag(tag);
    
    // Check if item has any tags
    if (!this.itemToTags.has(itemId)) {
      return { success: false, message: 'Item has no tags' };
    }
    
    const itemTags = this.itemToTags.get(itemId);
    
    // Check if item has the specified tag
    if (!itemTags.has(normalizedTag)) {
      return { success: false, message: 'Item does not have this tag' };
    }
    
    // Remove tag from item
    itemTags.delete(normalizedTag);
    
    // Remove item from tag's item set
    if (this.tagToItems.has(normalizedTag)) {
      this.tagToItems.get(normalizedTag).delete(itemId);
      
      // Clean up empty tag sets
      if (this.tagToItems.get(normalizedTag).size === 0) {
        this.tagToItems.delete(normalizedTag);
      }
    }
    
    // Clean up item if it has no more tags
    if (itemTags.size === 0) {
      this.itemToTags.delete(itemId);
    }
    
    return { 
      success: true, 
      itemId, 
      removedTag: normalizedTag,
      remainingTags: itemTags.size 
    };
  }
  
  /**
   * Get all tags for an item
   */
  getItemTags(itemId, options = {}) {
    if (!this.itemToTags.has(itemId)) {
      return [];
    }
    
    const directTags = [...this.itemToTags.get(itemId)];
    
    // If not including inherited tags, return direct tags only
    if (!options.includeInherited) {
      return directTags;
    }
    
    // Include inherited tags from parent tags
    const allTags = new Set(directTags);
    
    if (this.options.enableHierarchy) {
      for (const tag of directTags) {
        if (this.tagParents.has(tag)) {
          for (const parentTag of this.tagParents.get(tag)) {
            allTags.add(parentTag);
            
            // Add ancestor tags recursively
            this.addAncestorTags(parentTag, allTags);
          }
        }
      }
    }
    
    return [...allTags];
  }
  
  /**
   * Recursively add ancestor tags to a set
   */
  addAncestorTags(tag, tagSet) {
    if (!this.tagParents.has(tag)) {
      return;
    }
    
    for (const parentTag of this.tagParents.get(tag)) {
      tagSet.add(parentTag);
      this.addAncestorTags(parentTag, tagSet);
    }
  }
  
  /**
   * Find items with specific tags using various filter operators
   */
  findItemsByTags(tagFilters, options = {}) {
    const filterOptions = {
      operator: 'AND', // AND, OR, NOT
      includeChildren: true,
      includeSynonyms: this.options.enableSynonyms,
      limit: 1000,
      sortBy: null, // null, 'tagCount', 'recentlyAdded'
      ...options
    };
    
    const normalizedFilters = this.normalizeTags(tagFilters);
    
    if (normalizedFilters.length === 0) {
      return { success: false, message: 'No valid tag filters provided', items: [] };
    }
    
    // Apply the appropriate set operation based on the operator
    let resultSet;
    
    switch (filterOptions.operator) {
      case 'AND':
        resultSet = this.findItemsWithAllTags(normalizedFilters, filterOptions);
        break;
      case 'OR':
        resultSet = this.findItemsWithAnyTags(normalizedFilters, filterOptions);
        break;
      case 'NOT':
        resultSet = this.findItemsWithoutTags(normalizedFilters, filterOptions);
        break;
      default:
        return { success: false, message: `Invalid operator: ${filterOptions.operator}`, items: [] };
    }
    
    // Convert result set to array and apply sorting if needed
    let resultArray = [...resultSet];
    
    if (filterOptions.sortBy) {
      resultArray = this.sortResults(resultArray, filterOptions.sortBy);
    }
    
    // Apply limit
    if (filterOptions.limit && resultArray.length > filterOptions.limit) {
      resultArray = resultArray.slice(0, filterOptions.limit);
    }
    
    return {
      success: true,
      items: resultArray,
      count: resultArray.length,
      totalPossible: resultSet.size,
      appliedFilters: normalizedFilters,
      operator: filterOptions.operator
    };
  }
  
  /**
   * Find items that have all the specified tags (AND operation)
   */
  findItemsWithAllTags(tags, options) {
    if (tags.length === 0) {
      return new Set();
    }
    
    // Start with the items from the first tag
    const expandedTags = this.getExpandedTags(tags[0], options);
    let resultSet = this.getItemsForTags(expandedTags);
    
    // Intersect with items from each remaining tag
    for (let i = 1; i < tags.length; i++) {
      const expandedTag = this.getExpandedTags(tags[i], options);
      const tagItems = this.getItemsForTags(expandedTag);
      
      // Update result set to only include items that also have this tag
      resultSet = new Set([...resultSet].filter(item => tagItems.has(item)));
      
      // Short circuit if result is already empty
      if (resultSet.size === 0) {
        break;
      }
    }
    
    return resultSet;
  }
  
  /**
   * Find items that have any of the specified tags (OR operation)
   */
  findItemsWithAnyTags(tags, options) {
    const resultSet = new Set();
    
    // Union all items with any of the specified tags
    for (const tag of tags) {
      const expandedTags = this.getExpandedTags(tag, options);
      const tagItems = this.getItemsForTags(expandedTags);
      
      // Add all items with this tag to the result set
      for (const item of tagItems) {
        resultSet.add(item);
      }
    }
    
    return resultSet;
  }
  
  /**
   * Find items that don't have any of the specified tags (NOT operation)
   */
  findItemsWithoutTags(tags, options) {
    // Start with all items that have any tags
    const allItems = new Set();
    for (const [itemId] of this.itemToTags) {
      allItems.add(itemId);
    }
    
    // Get items that have any of the specified tags
    const itemsWithTags = this.findItemsWithAnyTags(tags, options);
    
    // Return items that are not in the itemsWithTags set
    return new Set([...allItems].filter(item => !itemsWithTags.has(item)));
  }
  
  /**
   * Get items that have any of the specified tags
   */
  getItemsForTags(tags) {
    const resultSet = new Set();
    
    for (const tag of tags) {
      if (this.tagToItems.has(tag)) {
        for (const item of this.tagToItems.get(tag)) {
          resultSet.add(item);
        }
      }
    }
    
    return resultSet;
  }
  
  /**
   * Get expanded tag set including child tags and synonyms
   */
  getExpandedTags(tag, options) {
    const expandedTags = new Set([tag]);
    
    // Add child tags if enabled
    if (options.includeChildren && this.options.enableHierarchy) {
      this.addChildTags(tag, expandedTags);
    }
    
    // Add synonyms if enabled
    if (options.includeSynonyms && this.options.enableSynonyms) {
      this.addTagSynonyms(tag, expandedTags);
    }
    
    return expandedTags;
  }
  
  /**
   * Recursively add child tags to a set
   */
  addChildTags(tag, tagSet) {
    if (!this.tagHierarchy.has(tag)) {
      return;
    }
    
    for (const childTag of this.tagHierarchy.get(tag)) {
      tagSet.add(childTag);
      this.addChildTags(childTag, tagSet);
    }
  }
  
  /**
   * Add tag synonyms to a set
   */
  addTagSynonyms(tag, tagSet) {
    if (!this.tagSynonyms.has(tag)) {
      return;
    }
    
    for (const synonym of this.tagSynonyms.get(tag)) {
      tagSet.add(synonym);
    }
  }
  
  /**
   * Sort results based on specified criteria
   */
  sortResults(items, sortBy) {
    switch (sortBy) {
      case 'tagCount':
        // Sort by number of tags (descending)
        return items.sort((a, b) => {
          const aCount = this.itemToTags.has(a) ? this.itemToTags.get(a).size : 0;
          const bCount = this.itemToTags.has(b) ? this.itemToTags.get(b).size : 0;
          return bCount - aCount;
        });
        
      case 'recentlyAdded':
        // This would require timestamp metadata
        return items;
        
      default:
        return items;
    }
  }
  
  /**
   * Add a tag to the hierarchy with a specified parent
   */
  addTagToHierarchy(tag, parentTag) {
    if (!this.options.enableHierarchy) {
      return { success: false, message: 'Hierarchy support is disabled' };
    }
    
    const normalizedTag = this.normalizeTag(tag);
    const normalizedParent = this.normalizeTag(parentTag);
    
    if (normalizedTag === normalizedParent) {
      return { success: false, message: 'Tag cannot be its own parent' };
    }
    
    // Check for circular references
    if (this.wouldCreateCircularReference(normalizedTag, normalizedParent)) {
      return { success: false, message: 'Would create circular reference in hierarchy' };
    }
    
    // Add parent → child relationship
    if (!this.tagHierarchy.has(normalizedParent)) {
      this.tagHierarchy.set(normalizedParent, new Set());
    }
    this.tagHierarchy.get(normalizedParent).add(normalizedTag);
    
    // Add child → parent relationship
    if (!this.tagParents.has(normalizedTag)) {
      this.tagParents.set(normalizedTag, new Set());
    }
    this.tagParents.get(normalizedTag).add(normalizedParent);
    
    return { 
      success: true, 
      child: normalizedTag, 
      parent: normalizedParent 
    };
  }
  
  /**
   * Check if adding a parent would create a circular reference
   */
  wouldCreateCircularReference(tag, newParent) {
    // Check if the child tag is already an ancestor of the proposed parent
    const ancestors = new Set();
    this.collectAncestors(tag, ancestors);
    return ancestors.has(newParent);
  }
  
  /**
   * Collect all ancestors of a tag recursively
   */
  collectAncestors(tag, ancestorSet) {
    if (!this.tagParents.has(tag)) {
      return;
    }
    
    for (const parent of this.tagParents.get(tag)) {
      ancestorSet.add(parent);
      this.collectAncestors(parent, ancestorSet);
    }
  }
  
  /**
   * Add a tag synonym
   */
  addTagSynonym(tag, synonym) {
    if (!this.options.enableSynonyms) {
      return { success: false, message: 'Synonym support is disabled' };
    }
    
    const normalizedTag = this.normalizeTag(tag);
    const normalizedSynonym = this.normalizeTag(synonym);
    
    if (normalizedTag === normalizedSynonym) {
      return { success: false, message: 'A tag cannot be its own synonym' };
    }
    
    // Initialize synonym set if needed
    if (!this.tagSynonyms.has(normalizedTag)) {
      this.tagSynonyms.set(normalizedTag, new Set());
    }
    
    this.tagSynonyms.get(normalizedTag).add(normalizedSynonym);
    
    return { 
      success: true, 
      tag: normalizedTag, 
      synonym: normalizedSynonym 
    };
  }
  
  /**
   * Register a tag category
   */
  addCategory(categoryName, description = '') {
    const normalizedCategory = this.normalizeTag(categoryName);
    
    if (normalizedCategory.length === 0) {
      return { success: false, message: 'Invalid category name' };
    }
    
    this.categories.set(normalizedCategory, {
      name: normalizedCategory,
      description,
      tags: new Set()
    });
    
    return { 
      success: true, 
      category: normalizedCategory 
    };
  }
  
  /**
   * Add a tag to a category
   */
  addTagToCategory(tag, categoryName) {
    const normalizedTag = this.normalizeTag(tag);
    const normalizedCategory = this.normalizeTag(categoryName);
    
    if (!this.categories.has(normalizedCategory)) {
      return { success: false, message: 'Category does not exist' };
    }
    
    const category = this.categories.get(normalizedCategory);
    category.tags.add(normalizedTag);
    
    // Add category metadata to tag
    if (!this.tagMetadata.has(normalizedTag)) {
      this.tagMetadata.set(normalizedTag, {});
    }
    
    const metadata = this.tagMetadata.get(normalizedTag);
    if (!metadata.categories) {
      metadata.categories = [];
    }
    
    if (!metadata.categories.includes(normalizedCategory)) {
      metadata.categories.push(normalizedCategory);
    }
    
    return { 
      success: true, 
      tag: normalizedTag, 
      category: normalizedCategory 
    };
  }
  
  /**
   * Get all tags in a category
   */
  getTagsByCategory(categoryName) {
    const normalizedCategory = this.normalizeTag(categoryName);
    
    if (!this.categories.has(normalizedCategory)) {
      return { success: false, message: 'Category does not exist', tags: [] };
    }
    
    const category = this.categories.get(normalizedCategory);
    
    return { 
      success: true, 
      category: normalizedCategory,
      description: category.description,
      tags: [...category.tags]
    };
  }
  
  /**
   * Apply auto-tagging rules
   */
  applyAutoTagging(itemId, tag) {
    // This would implement domain-specific auto-tagging rules
    // For example, adding 'javascript' might auto-tag with 'programming'
    return;
  }
  
  /**
   * Save a commonly used tag set for reuse
   */
  saveTagSet(name, tags) {
    const normalizedName = this.normalizeTag(name);
    const normalizedTags = this.normalizeTags(tags);
    
    if (normalizedName.length === 0) {
      return { success: false, message: 'Invalid tag set name' };
    }
    
    if (normalizedTags.length === 0) {
      return { success: false, message: 'No valid tags provided' };
    }
    
    this.commonTagSets.set(normalizedName, new Set(normalizedTags));
    
    return { 
      success: true, 
      name: normalizedName, 
      tags: normalizedTags 
    };
  }
  
  /**
   * Get a saved tag set
   */
  getTagSet(name) {
    const normalizedName = this.normalizeTag(name);
    
    if (!this.commonTagSets.has(normalizedName)) {
      return { success: false, message: 'Tag set not found', tags: [] };
    }
    
    return { 
      success: true, 
      name: normalizedName, 
      tags: [...this.commonTagSets.get(normalizedName)] 
    };
  }
  
  /**
   * Get all items with any tags
   */
  getAllTaggedItems() {
    return new Set([...this.itemToTags.keys()]);
  }
  
  /**
   * Get all known tags
   */
  getAllTags() {
    return new Set([...this.tagToItems.keys()]);
  }
  
  /**
   * Get tag usage statistics
   */
  getTagStats() {
    const stats = {
      totalTags: this.tagToItems.size,
      totalItems: this.itemToTags.size,
      tagsByUsage: [],
      categoryCounts: {},
      hierarchyDepth: this.calculateHierarchyDepth()
    };
    
    // Count tags by usage
    for (const [tag, items] of this.tagToItems.entries()) {
      stats.tagsByUsage.push({
        tag,
        count: items.size
      });
    }
    
    // Sort by usage (descending)
    stats.tagsByUsage.sort((a, b) => b.count - a.count);
    
    // Count tags by category
    for (const [category, data] of this.categories.entries()) {
      stats.categoryCounts[category] = data.tags.size;
    }
    
    return stats;
  }
  
  /**
   * Calculate the maximum depth of the tag hierarchy
   */
  calculateHierarchyDepth() {
    let maxDepth = 0;
    
    for (const tag of this.tagToItems.keys()) {
      const depth = this.calculateTagDepth(tag);
      maxDepth = Math.max(maxDepth, depth);
    }
    
    return maxDepth;
  }
  
  /**
   * Calculate the depth of a specific tag in the hierarchy
   */
  calculateTagDepth(tag, visited = new Set()) {
    // Avoid circular references
    if (visited.has(tag)) {
      return 0;
    }
    
    visited.add(tag);
    
    if (!this.tagParents.has(tag)) {
      return 0; // Root level tag
    }
    
    let maxParentDepth = 0;
    
    for (const parent of this.tagParents.get(tag)) {
      const parentDepth = this.calculateTagDepth(parent, new Set(visited)) + 1;
      maxParentDepth = Math.max(maxParentDepth, parentDepth);
    }
    
    return maxParentDepth;
  }
}

/**
 * Example usage of the Tag Filtering System
 */
async function demonstrateTagFiltering() {
  console.log("Initializing Tag Filtering System...");
  
  const tagSystem = new TagFilteringSystem({
    enableHierarchy: true,
    enableSynonyms: true
  });
  
  // Setup tag hierarchy
  console.log("\n1. Setting up tag hierarchy...");
  
  // Programming language hierarchy
  tagSystem.addTagToHierarchy('javascript', 'programming-language');
  tagSystem.addTagToHierarchy('typescript', 'javascript');
  tagSystem.addTagToHierarchy('react', 'javascript-framework');
  tagSystem.addTagToHierarchy('javascript-framework', 'programming');
  tagSystem.addTagToHierarchy('programming-language', 'programming');
  
  // Status tags
  tagSystem.addTagToHierarchy('in-progress', 'status');
  tagSystem.addTagToHierarchy('completed', 'status');
  tagSystem.addTagToHierarchy('needs-review', 'status');
  
  // Add tags to categories
  tagSystem.addTagToCategory('javascript', 'language');
  tagSystem.addTagToCategory('typescript', 'language');
  tagSystem.addTagToCategory('react', 'framework');
  tagSystem.addTagToCategory('in-progress', 'status');
  tagSystem.addTagToCategory('completed', 'status');
  tagSystem.addTagToCategory('needs-review', 'status');
  
  // Add synonyms
  tagSystem.addTagSynonym('javascript', 'js');
  tagSystem.addTagSynonym('typescript', 'ts');
  tagSystem.addTagSynonym('react', 'reactjs');
  
  // Create a common tag set
  tagSystem.saveTagSet('frontend-stack', ['javascript', 'typescript', 'react', 'html', 'css']);
  
  // Add tags to items
  console.log("\n2. Tagging items...");
  
  // Code files
  tagSystem.tagItem('file-1.js', ['javascript', 'utility', 'completed']);
  tagSystem.tagItem('file-2.ts', ['typescript', 'react', 'component', 'needs-review']);
  tagSystem.tagItem('file-3.tsx', ['typescript', 'react', 'component', 'in-progress']);
  tagSystem.tagItem('file-4.js', ['javascript', 'test', 'completed']);
  tagSystem.tagItem('file-5.js', ['javascript', 'react', 'component', 'completed']);
  
  // Documentation
  tagSystem.tagItem('doc-1.md', ['documentation', 'javascript', 'completed']);
  tagSystem.tagItem('doc-2.md', ['documentation', 'typescript', 'in-progress']);
  tagSystem.tagItem('doc-3.md', ['documentation', 'react', 'needs-review']);
  
  // Find items with specific tags
  console.log("\n3. Performing tag-based queries...");
  
  // Simple AND query: Find items that are both JavaScript and completed
  const jsCompletedItems = tagSystem.findItemsByTags(['javascript', 'completed'], {
    operator: 'AND'
  });
  
  console.log(`\nJavaScript AND completed items: ${jsCompletedItems.count}`);
  console.log(jsCompletedItems.items.join(', '));
  
  // OR query: Find items that are either React OR TypeScript
  const reactOrTsItems = tagSystem.findItemsByTags(['react', 'typescript'], {
    operator: 'OR'
  });
  
  console.log(`\nReact OR TypeScript items: ${reactOrTsItems.count}`);
  console.log(reactOrTsItems.items.join(', '));
  
  // NOT query: Find items that are not documentation
  const nonDocItems = tagSystem.findItemsByTags(['documentation'], {
    operator: 'NOT'
  });
  
  console.log(`\nNon-documentation items: ${nonDocItems.count}`);
  console.log(nonDocItems.items.join(', '));
  
  // Complex query with hierarchy: Find all programming items
  const programmingItems = tagSystem.findItemsByTags(['programming'], {
    operator: 'AND',
    includeChildren: true
  });
  
  console.log(`\nAll programming items (including children): ${programmingItems.count}`);
  console.log(programmingItems.items.join(', '));
  
  // Query with synonyms: Find js items using the synonym
  const jsItems = tagSystem.findItemsByTags(['js'], {
    operator: 'AND',
    includeSynonyms: true
  });
  
  console.log(`\nAll JavaScript items (using synonym 'js'): ${jsItems.count}`);
  console.log(jsItems.items.join(', '));
  
  // Category-based query: Find all language-tagged items
  const languageTagsResult = tagSystem.getTagsByCategory('language');
  const languageTags = languageTagsResult.tags;
  
  const languageItems = tagSystem.findItemsByTags(languageTags, {
    operator: 'OR'
  });
  
  console.log(`\nItems with any language tag (${languageTags.join(', ')}): ${languageItems.count}`);
  console.log(languageItems.items.join(', '));
  
  // Tagged item stats
  console.log("\n4. Tag system statistics:");
  
  const stats = tagSystem.getTagStats();
  console.log(`Total unique tags: ${stats.totalTags}`);
  console.log(`Total tagged items: ${stats.totalItems}`);
  console.log(`Tag hierarchy depth: ${stats.hierarchyDepth}`);
  
  console.log("\nTop tags by usage:");
  stats.tagsByUsage.slice(0, 5).forEach(tag => {
    console.log(`- ${tag.tag}: ${tag.count} items`);
  });
}

// Run the demonstration
demonstrateTagFiltering().catch(console.error); 