import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import sharp from "sharp";

// Character names for file organization
const characters = [
  { name: "banana-splash", displayName: "Banana Splash" },
  { name: "sprout-mole", displayName: "Sprout Mole" },
  { name: "desert-dash", displayName: "Desert Dash" },
  { name: "bamboo-breeze", displayName: "Bamboo Breeze" },
  { name: "code-monkey", displayName: "Code Monkey" },
  { name: "artisan-owl", displayName: "Artisan Owl" },
  { name: "captain-canary", displayName: "Captain Canary" },
  { name: "banana-sage", displayName: "Banana Sage" }
];

// 4 rotation angles (every 90 degrees)
const rotationAngles = [
  { angle: 0, description: "front view" },
  { angle: 90, description: "profile view from the character's right side (character is looking left)" },
  { angle: 180, description: "back view" },
  { angle: 270, description: "profile view from the character's left side (character is looking right)" }
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
This is a technical task for a 3D turntable animation sequence.
Using the provided image as the master reference for the character's appearance, generate a new image of the exact same figurine rotated on its circular base to a precise ${description} (${angle} degrees clockwise).

**Critical Constraints for Perfect Consistency:**
1.  **Stationary Base and Camera**: The circular base the character stands on MUST NOT move, scale, or change its perspective. Imagine the camera is locked in place. The base's position, size, and shape in the output image must be identical to the input image.
2.  **Object Rotation Only**: Only the character figurine itself rotates on top of the stationary base.
3.  **Identical Appearance**: The character's design, colors, textures, and lighting must be absolutely identical to the source image. The lighting is fixed in the environment and does not rotate with the character.
4.  **Precise Angle**: The character must be rotated to the exact specified angle. A 90-degree view must be a perfect profile view. A 180-degree view must be a perfect rear view.

**Summary of Action**:
- **Input**: Image of a figurine at 0 degrees.
- **Action**: Rotate ONLY the character model on its base by ${angle} degrees.
- **Output**: Image from the same fixed camera, showing the rotated character on its unmoving base.
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

async function generateFlippedView(ai, sourceImagePath, characterName, angle, description, outputPath) {
  console.log(`Generating FLIPPED ${angle}° view for ${characterName}...`);
  try {
    const flippedImagePath = `public/rotations/${characterName.toLowerCase().replace(/ /g, '-')}/temp_flipped.png`;

    // 1. Flip the 90-degree image horizontally
    await sharp(sourceImagePath).flop().toFile(flippedImagePath);
    console.log(`✓ Temporarily flipped image created: ${flippedImagePath}`);

    // 2. Read the new flipped image
    const imageData = fs.readFileSync(flippedImagePath);
    const base64Image = imageData.toString("base64");

    // 3. Create a new prompt to "fix" the flipped image
    const fixPrompt = `
This is a technical rendering task.
The provided image is a horizontally flipped, low-quality reference.
Your task is to re-render the character in this exact right-facing pose, but applying the correct, consistent lighting, textures, and high-quality finish of the original character style.

**Critical Constraints:**
1.  **Preserve Pose**: The character's right-facing profile pose from the input image is correct and MUST be preserved.
2.  **Apply Correct Style**: Re-create the image with the high-quality, photorealistic 3D collectible figurine style.
3.  **Fix Lighting**: The lighting should be soft and even, coming from the front, consistent with the rest of the animation sequence. Do not use the lighting from the flipped input image.
4.  **Maintain Consistency**: Ensure the character's colors, textures, and the stationary circular base match the original front-facing view.

**Summary of Action**:
- **Input**: A low-quality, horizontally-flipped image showing the desired pose.
- **Action**: Re-render the character in this exact pose using the correct, high-quality style and lighting.
- **Output**: A clean, high-quality image of the character facing right.
`;

    const prompt = [{ text: fixPrompt }, { inlineData: { mimeType: "image/png", data: base64Image } }];

    const response = await ai.models.generateContent({ model: "gemini-2.5-flash-image-preview", contents: prompt });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const newImageData = part.inlineData.data;
        const buffer = Buffer.from(newImageData, "base64");
        fs.writeFileSync(outputPath, buffer);
        console.log(`✓ Successfully created: ${outputPath}`);
        // Clean up the temporary flipped image
        fs.unlinkSync(flippedImagePath);
        return;
      }
    }
  } catch (error) {
    console.error(`❌ Error generating flipped ${angle}° view for ${characterName}:`, error.message);
  }
}

async function generateAllRotationalViews() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in your .env file");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  console.log("🎯 Starting 4-view rotation generation for all characters...\n");

  for (const character of characters) {
    console.log(`\n📸 Processing ${character.displayName}...`);
    
    // Create character-specific directory
    const characterDir = `public/rotations/${character.name}`;
    if (!fs.existsSync(characterDir)) {
      fs.mkdirSync(characterDir, { recursive: true });
    }

    // Source image path (your original front-facing character images)
    const sourceImagePath = `public/${character.name}.png`;

    // Generate all 4 rotational views
    for (const rotation of rotationAngles) {
      const outputPath = `${characterDir}/${character.name}_${rotation.angle.toString().padStart(3, '0')}.png`;
      
      if (rotation.angle === 270) {
        // Use the special flipped-image technique for the 270-degree view
        const ninetyDegreeImagePath = `${characterDir}/${character.name}_090.png`;
        if (fs.existsSync(ninetyDegreeImagePath)) {
          await generateFlippedView(ai, ninetyDegreeImagePath, character.displayName, rotation.angle, rotation.description, outputPath);
        } else {
          console.error(`Cannot generate 270° view because 90° view is missing: ${ninetyDegreeImagePath}`);
        }
      } else {
        // Use the standard text-to-image generation for 0, 90, and 180 degrees
        await generateRotationalView(
          ai, 
          sourceImagePath, 
          character.displayName, 
          rotation.angle, 
          rotation.description, 
          outputPath
        );
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`✅ Completed all 4 views for ${character.displayName}`);
  }

  console.log("\n🎉 All rotational views generated successfully!");
  console.log("\n📁 File structure:");
  console.log("public/rotations/");
  characters.forEach(char => {
    console.log(`  ├── ${char.name}/`);
    console.log(`  │   ├── ... (4 images: 000, 090, 180, 270)`);
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