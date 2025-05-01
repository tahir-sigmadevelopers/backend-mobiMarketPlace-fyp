// Basic sort test
console.log("Testing basic JavaScript sorting");

const products = [
  { _id: "1", price: 4999 },
  { _id: "2", price: 2999 },
  { _id: "3", price: 1001 },
  { _id: "4", price: 1000 },
  { _id: "5", price: 497 }
];

console.log("Original products:", products.map(p => p.price).join(", "));

// Ascending sort (Low to High)
const ascProducts = [...products].sort((a, b) => a.price - b.price);
console.log("Ascending (Low to High):", ascProducts.map(p => p.price).join(", "));

// Descending sort (High to Low)
const descProducts = [...products].sort((a, b) => b.price - a.price);
console.log("Descending (High to Low):", descProducts.map(p => p.price).join(", "));

// Verify the order is reversed between asc and desc
console.log("Asc is opposite of Desc?", 
  JSON.stringify(ascProducts.map(p => p.price)) !== 
  JSON.stringify(descProducts.map(p => p.price)));

// Manually check if the arrays are reversed of each other
console.log("Manually checking if arrays are reversed:");
for (let i = 0; i < ascProducts.length; i++) {
  console.log(`ascProducts[${i}]: ${ascProducts[i].price} vs descProducts[${ascProducts.length-1-i}]: ${descProducts[ascProducts.length-1-i].price}`);
} 