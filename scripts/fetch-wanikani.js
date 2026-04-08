const fs = require('fs');
const path = require('path');

// TODO: Use your NEW token here!
const API_TOKEN = '432c545a-c427-445e-9053-71240fbb1069'; 

async function fetchAllWaniKaniData() {
  let allSubjects = [];
  // You can filter by level here if you don't want all 60 levels right away
  // e.g., 'https://api.wanikani.com/v2/subjects?levels=1,2,3,4,5'
  let nextUrl = 'https://api.wanikani.com/v2/subjects'; 

  console.log("🚀 Starting WaniKani API extraction...");

  try {
    while (nextUrl) {
      console.log(`📡 Fetching data from: ${nextUrl}`);
      
      const response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Wanikani-Revision': '20170710' // Required by WaniKani
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();
      
      // Add the items from this page to our master array
      allSubjects = allSubjects.concat(json.data);
      
      // Update the URL to the next page (will be null on the final page)
      nextUrl = json.pages.next_url; 
    }

    console.log(`✅ Extraction complete! Total items fetched: ${allSubjects.length}`);

    // Ensure the assets/data directory exists
    const dirPath = path.join(__dirname, '../assets/data');
    if (!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath, { recursive: true });
    }

    // Save the massive array to a local JSON file
    const filePath = path.join(dirPath, 'wanikani-massive-dump.json');
    fs.writeFileSync(filePath, JSON.stringify(allSubjects, null, 2));
    
    console.log(`💾 Successfully saved to ${filePath}`);

  } catch (error) {
    console.error("❌ Something went wrong:", error.message);
  }
}

fetchAllWaniKaniData();