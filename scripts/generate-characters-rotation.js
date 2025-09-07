import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import sharp from "sharp";

// Character names for file organization
const characters = [
  { name: "banana-scout", displayName: "Banana Scout" },
  { name: "sprout-mole", displayName: "Sprout Mole" },
  { name: "desert-dash", displayName: "Desert Dash" },
  { name: "bamboo-breeze", displayName: "Bamboo Breeze" },
  { name: "code-monkey", displayName: "Code Monkey" },
  { name: "artisan-owl", displayName: "Artisan Owl" },
  { name: "captain-canary", displayName: "Captain Canary" },
  { name: "banana-sage", displayName: "Banana Sage" }
];

// Rotation directions - source image is front-facing
const rotationDirections = [
  { direction: "front", method: "copy" },
  { direction: "left", method: "generate" },
  { direction: "back", method: "generate" },
  { direction: "right", method: "generate" },
];

async function generateRotationalView(ai, sourceImagePath, characterName, direction, description, outputPath) {
  console.log(`Generating ${direction} view for ${characterName}...`);
  try {
    const promptParts = [];

    // Dynamically build the prompt based on the direction
    promptParts.push({
      text: `
This is a technical task for generating consistent character rotations for a game.

**Reference Information:**
The provided source image shows the character facing FRONT.

**Task:**
Generate a new image of the exact same character rotated to face ${direction.toUpperCase()}.

**Critical Constraints for Perfect Consistency:**
1. **Stationary Base**: The circular base the character stands on MUST NOT move or change.
2. **Character Rotation Only**: Only rotate the character itself on top of the stationary base.
3. **Consistent Lighting**: Maintain identical lighting conditions from the source image.
4. **Identical Appearance**: The character's design, colors, and textures must match the source exactly.
5. **Precise Direction**: The character must face exactly ${direction.toUpperCase()}.

**Summary of Action**:
- **Input**: Image of a character facing FRONT
- **Action**: Rotate ONLY the character model on its base to face ${direction.toUpperCase()}
- **Output**: Image from the same fixed camera, showing the rotated character on its unmoving base`
    });

    // Add source image to the prompt
    const imageData = fs.readFileSync(sourceImagePath);
    const base64Image = imageData.toString("base64");
    promptParts.push({
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: promptParts,
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
        topK: 40,
      },
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
    console.error(`❌ Error generating ${direction} view for ${characterName}:`, error.message);
    throw error; // Re-throw to handle quota issues
  }
}

async function generateAllRotationalViews() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in your .env file");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  console.log("🎯 Starting 4-direction rotation generation for all characters...\n");

  for (const character of characters) {
    console.log(`\n📸 Processing ${character.displayName}...`);
    
    // Create character-specific directory
    const characterDir = `public/rotations/${character.name}`;
    if (!fs.existsSync(characterDir)) {
      fs.mkdirSync(characterDir, { recursive: true });
    }

    // Source image path (your original front-facing character images)
    const sourceImagePath = `public/${character.name}.png`;

    // Check if source image exists
    if (!fs.existsSync(sourceImagePath)) {
      console.error(`❌ Source image not found for ${character.displayName}: ${sourceImagePath}`);
      continue;
    }

    // Generate all views
    console.log(`\n  -> Generating directional views...`);
    for (const rotation of rotationDirections) {
      const outputPath = `${characterDir}/${character.name}_${rotation.direction}.png`;

      if (rotation.method === "copy") {
        // For the front view, just copy the source image directly
        console.log(`Copying source for front-facing view for ${character.displayName}...`);
        fs.copyFileSync(sourceImagePath, outputPath);
        console.log(`✓ Successfully created: ${outputPath}`);
      } else {
        try {
          await generateRotationalView(
            ai,
            sourceImagePath,
            character.displayName,
            rotation.direction,
            rotation.description,
            outputPath
          );
          await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay to avoid quota issues
        } catch (error) {
          if (error.error && error.error.code === 429) {
            console.error(`❌ Quota exceeded. Please try again later.`);
            return; // Stop processing if we hit quota limits
          }
        }
      }
    }

    console.log(`✅ Completed all 4 directions for ${character.displayName}`);
  }

  console.log("\n🎉 All directional views generated successfully!");
  console.log("\n📁 File structure:");
  console.log("public/rotations/");
  characters.forEach(char => {
    console.log(`  ├── ${char.name}/`);
    console.log(`  │   ├── ${char.name}_front.png (Front)`);
    console.log(`  │   ├── ${char.name}_left.png (Left)`);
    console.log(`  │   ├── ${char.name}_back.png (Back)`);
    console.log(`  │   └── ${char.name}_right.png (Right)`);
  });
}

// Main execution
async function main() {
  try {
    // Get character name from command line arguments, if provided
    const characterArg = process.argv[2];

    if (characterArg) {
      console.log(`Single character mode: ${characterArg}`);
      const characterToGen = characters.find(c => c.name === characterArg);
      if (!characterToGen) {
        console.error(`❌ Character "${characterArg}" not found.`);
        console.log("Available characters:", characters.map(c => c.name).join(", "));
        return;
      }
      
      // Temporarily modify the characters array to only include the selected one
      const originalCharacters = [...characters];
      characters.length = 0;
      characters.push(characterToGen);

      await generateAllRotationalViews();

      // Restore original characters array if needed elsewhere
      characters.length = 0;
      characters.push(...originalCharacters);

    } else {
      console.log("All characters mode. No argument provided.");
      await generateAllRotationalViews();
    }
    
  } catch (error) {
    console.error("❌ Error in main execution:", error);
  }
}

main();