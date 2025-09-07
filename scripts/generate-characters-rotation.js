import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

// Character names for file organization
const characters = [
  { name: "banana-buddy", displayName: "Banana Buddy" },
  { name: "banana-belle", displayName: "Banana Belle" },
  { name: "study-sprint", displayName: "Study Sprint" },
  { name: "campus-champ", displayName: "Campus Champ" },
  { name: "banana-pro", displayName: "Banana Pro" },
  { name: "career-climber", displayName: "Career Climber" },
  { name: "executive-elite", displayName: "Executive Elite" }
];

// 12 rotation angles (every 30 degrees)
const rotationAngles = [
  { angle: 0, description: "front view" },
  { angle: 30, description: "30° clockwise from front" },
  { angle: 60, description: "60° clockwise from front" },
  { angle: 90, description: "right side view" },
  { angle: 120, description: "120° clockwise from front" },
  { angle: 150, description: "150° clockwise from front" },
  { angle: 180, description: "back view" },
  { angle: 210, description: "210° clockwise from front" },
  { angle: 240, description: "240° clockwise from front" },
  { angle: 270, description: "left side view" },
  { angle: 300, description: "300° clockwise from front" },
  { angle: 330, description: "330° clockwise from front" }
];

async function generateRotationalView(ai, sourceImagePath, characterName, angle, description, outputPath) {
  console.log(`Generating ${angle}° view for ${characterName}...`);
  
  try {
    // Check if source image exists
    if (!fs.existsSync(sourceImagePath)) {
      console.error(`Source image not found: ${sourceImagePath}`);
      return;
    }

    // Read the source image
    const imageData = fs.readFileSync(sourceImagePath);
    const base64Image = imageData.toString("base64");

    // Create the rotation prompt
    const rotationPrompt = `
Using this character figurine image, create a photorealistic, 3D rendered view of the same character rotated to show a ${description}.

IMPORTANT REQUIREMENTS:
- Maintain the EXACT same character design, clothing, accessories, and proportions
- Keep the same figurine material and finish quality
- Preserve all original colors and textures
- Maintain the same clean, solid light grey background (#F5F5F5)
- Use consistent soft, even lighting that highlights the character's features
- Show the character from a ${description} perspective
- Keep the same professional collectible figurine aesthetic
- Do NOT change any character details, only the viewing angle

The rotation should be smooth and natural, as if the figurine was rotated ${angle} degrees clockwise on a turntable.
`;

    const prompt = [
      { text: rotationPrompt },
      {
        inlineData: {
          mimeType: "image/png",
          data: base64Image,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    });

    // Save the generated image
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const newImageData = part.inlineData.data;
        const buffer = Buffer.from(newImageData, "base64");
        fs.writeFileSync(outputPath, buffer);
        console.log(`✓ Successfully created: ${outputPath}`);
        return;
      }
    }
    
    console.log(`⚠ No image data received for ${outputPath}`);
    
  } catch (error) {
    console.error(`❌ Error generating ${angle}° view for ${characterName}:`, error.message);
  }
}

async function generateAllRotationalViews() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in your .env file");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  console.log("🎯 Starting 12-view rotation generation for all characters...\n");

  for (const character of characters) {
    console.log(`\n📸 Processing ${character.displayName}...`);
    
    // Create character-specific directory
    const characterDir = `public/rotations/${character.name}`;
    if (!fs.existsSync(characterDir)) {
      fs.mkdirSync(characterDir, { recursive: true });
    }

    // Source image path (your original front-facing character images)
    const sourceImagePath = `public/${character.name}.png`;

    // Generate all 12 rotational views
    for (let i = 0; i < rotationAngles.length; i++) {
      const rotation = rotationAngles[i];
      const outputPath = `${characterDir}/${character.name}_${rotation.angle.toString().padStart(3, '0')}.png`;
      
      await generateRotationalView(
        ai, 
        sourceImagePath, 
        character.displayName, 
        rotation.angle, 
        rotation.description, 
        outputPath
      );
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Completed all 12 views for ${character.displayName}`);
  }

  console.log("\n🎉 All rotational views generated successfully!");
  console.log("\n📁 File structure:");
  console.log("public/rotations/");
  characters.forEach(char => {
    console.log(`  ├── ${char.name}/`);
    console.log(`  │   ├── ${char.name}_000.png (0° - front)`);
    console.log(`  │   ├── ${char.name}_030.png (30°)`);
    console.log(`  │   ├── ${char.name}_060.png (60°)`);
    console.log(`  │   ├── ${char.name}_090.png (90° - right side)`);
    console.log(`  │   ├── ${char.name}_120.png (120°)`);
    console.log(`  │   ├── ${char.name}_150.png (150°)`);
    console.log(`  │   ├── ${char.name}_180.png (180° - back)`);
    console.log(`  │   ├── ${char.name}_210.png (210°)`);
    console.log(`  │   ├── ${char.name}_240.png (240°)`);
    console.log(`  │   ├── ${char.name}_270.png (270° - left side)`);
    console.log(`  │   ├── ${char.name}_300.png (300°)`);
    console.log(`  │   └── ${char.name}_330.png (330°)`);
  });
}

// Helper function to generate just one character's rotations (for testing)
async function generateSingleCharacterRotations(characterName) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in your .env file");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const character = characters.find(char => char.name === characterName);
  
  if (!character) {
    console.error(`Character "${characterName}" not found. Available characters:`, characters.map(c => c.name));
    return;
  }

  console.log(`🎯 Generating 12 rotational views for ${character.displayName}...\n`);
  
  const characterDir = `public/rotations/${character.name}`;
  if (!fs.existsSync(characterDir)) {
    fs.mkdirSync(characterDir, { recursive: true });
  }

  const sourceImagePath = `public/${character.name}.png`;

  for (let i = 0; i < rotationAngles.length; i++) {
    const rotation = rotationAngles[i];
    const outputPath = `${characterDir}/${character.name}_${rotation.angle.toString().padStart(3, '0')}.png`;
    
    await generateRotationalView(
      ai, 
      sourceImagePath, 
      character.displayName, 
      rotation.angle, 
      rotation.description, 
      outputPath
    );
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`✅ Completed all 12 views for ${character.displayName}`);
}

// Main execution
async function main() {
  try {
    // Generate all characters (comment out if you want to test single character first)
    await generateAllRotationalViews();
    
    // OR generate single character for testing (uncomment the line below)
    // await generateSingleCharacterRotations("banana-buddy");
    
  } catch (error) {
    console.error("❌ Error in main execution:", error);
  }
}

main();