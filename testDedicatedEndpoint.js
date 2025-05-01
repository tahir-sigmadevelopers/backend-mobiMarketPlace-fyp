// Script to test the dedicated sorting endpoint
import axios from 'axios';

async function testSortedEndpoint() {
  try {
    // Test ascending sort (LOW to HIGH)
    console.log("Testing price ascending (LOW to HIGH) with dedicated endpoint...");
    const ascResponse = await axios.get(`http://localhost:5000/product/sorted?search=&page=1&price=700000&sort=price-asc&_t=${Date.now()}`);
    
    // Test descending sort (HIGH to LOW)
    console.log("Testing price descending (HIGH to LOW) with dedicated endpoint...");
    const descResponse = await axios.get(`http://localhost:5000/product/sorted?search=&page=1&price=700000&sort=price-desc&_t=${Date.now()}`);
    
    // Extract product data
    const ascProducts = ascResponse.data.products;
    const descProducts = descResponse.data.products;
    
    // Display products
    console.log("\n--- PRICE ASCENDING (LOW to HIGH) ---");
    const ascPrices = ascProducts.map(p => p.price);
    console.log(ascPrices.join(", "));
    
    console.log("\n--- PRICE DESCENDING (HIGH to LOW) ---");
    const descPrices = descProducts.map(p => p.price);
    console.log(descPrices.join(", "));
    
    // Verify sorting is correct
    const isAscSorted = isSorted(ascPrices, (a, b) => a <= b);
    const isDescSorted = isSorted(descPrices, (a, b) => a >= b);
    
    console.log("\nAscending correctly sorted (LOW to HIGH)?", isAscSorted);
    console.log("Descending correctly sorted (HIGH to LOW)?", isDescSorted);
    
    // Check if the orders are opposite of each other
    const areOpposite = areArraysOpposite(ascPrices, descPrices);
    console.log("Are the two orders opposite of each other?", areOpposite);
    
  } catch (error) {
    console.error("Error testing sorted endpoint:", error.message);
  }
}

// Helper function to check if array is sorted according to comparator
function isSorted(arr, comparator) {
  for (let i = 0; i < arr.length - 1; i++) {
    if (!comparator(arr[i], arr[i+1])) {
      return false;
    }
  }
  return true;
}

// Helper function to check if arrays are opposite of each other
function areArraysOpposite(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[arr2.length - 1 - i]) {
      return false;
    }
  }
  return true;
}

testSortedEndpoint(); 