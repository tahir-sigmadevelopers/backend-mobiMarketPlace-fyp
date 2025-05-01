// Script to test sorting functionality
import axios from 'axios';

async function testSorting() {
  try {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    
    console.log("Testing price ascending sort (LOW to HIGH)...");
    const ascResponse = await axios.get(`http://localhost:5000/product/all?search=&page=1&price=700000&sort=price-asc&_t=${timestamp}`);
    
    console.log("Testing price descending sort (HIGH to LOW)...");
    const descResponse = await axios.get(`http://localhost:5000/product/all?search=&page=1&price=700000&sort=price-desc&_t=${timestamp+1}`);
    
    // Extract and sort for display
    const ascProducts = ascResponse.data.products;
    const descProducts = descResponse.data.products;
    
    console.log("\n--- PRICE ASCENDING (LOW TO HIGH) ---");
    ascProducts.forEach(p => {
      console.log(`${p._id.substring(0,6)}... - $${p.price}`);
    });
    
    console.log("\n--- PRICE DESCENDING (HIGH TO LOW) ---");
    descProducts.forEach(p => {
      console.log(`${p._id.substring(0,6)}... - $${p.price}`);
    });
    
    // Check if ordering is correct
    const ascPrices = ascProducts.map(p => p.price);
    const descPrices = descProducts.map(p => p.price);
    
    console.log("\nAscending order correct?", 
      isSorted(ascPrices, (a, b) => a <= b));
    
    console.log("Descending order correct?", 
      isSorted(descPrices, (a, b) => a >= b));
      
    console.log("\nOrder should be REVERSED between the two lists. Is that true?",
      !areArraysEqual(ascPrices, descPrices));
    
  } catch (error) {
    console.error("Error testing sorting:", error.message);
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

// Helper function to check if arrays are equal
function areArraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

testSorting(); 