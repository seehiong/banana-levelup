import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";

// Base style template for consistency
const baseStyle = `
A photorealistic, 3D rendered, high-quality collectible figurine with a clean, professional finish.
The character should have warm, friendly facial features with detailed texturing.
The character is standing on a small, circular, light grey base, making it look like a physical collectible.
All characters must maintain consistent proportions and artistic style.
The background should be a clean, solid light grey (#F5F5F5).
The lighting should be soft and even, highlighting the character's features.
`;

const otterPupPrompt = `
${baseStyle}
Character: A playful river otter pup named 'Banana Splash'.
Appearance: Sleek, wet fur, wide innocent eyes, and a joyful expression.
Outfit: Wearing a small, yellow life vest with a banana logo on it.
Accessories: Juggling a small, perfectly ripe banana while floating on its back.
Pose: Floating playfully on its back on the circular base, which looks like a gentle water ripple.
Style: Adorable and energetic, representing youthful curiosity.
`;

const sproutMolePrompt = `
${baseStyle}
Character: A shy but curious mole named 'Sprout Mole'.
Appearance: Soft, dark fur, a cute pink nose, and large paws for digging. A tiny banana leaf is sprouting from the top of its head.
Outfit: Wearing a little gardener's apron with a pocket holding a seed packet.
Accessories: Holding a small, freshly picked banana like a prized treasure.
Pose: Peeking up from the circular base as if just emerging from the ground, holding the banana.
Style: Gentle and sweet, representing growth and discovery.
`;

const fennecFoxPrompt = `
${baseStyle}
Character: A clever fennec fox named 'Desert Dash', a quick-witted student.
Appearance: Enormous ears, sharp intelligent eyes, and a sandy-colored coat.
Outfit: Wearing a stylish, open hoodie in banana-yellow, with headphones around its neck.
Accessories: A messenger bag slung over its shoulder, with scrolls of ancient maps peeking out. A banana-shaped charm hangs from the bag's zipper.
Pose: Standing with a confident, ready-for-anything stance on the circular base, one paw on its messenger bag.
Style: Quick, smart, and trendy, representing a sharp and resourceful mind.
`;

const redPandaPrompt = `
${baseStyle}
Character: A chill and friendly red panda named 'Bamboo Breeze', a social butterfly.
Appearance: Fluffy striped tail, a sweet, content face with white facial markings.
Outfit: Wearing a comfortable, loose-fitting t-shirt with a banana print pattern.
Accessories: Holding a large boba tea with a banana flavor, and wearing a friendship bracelet made of woven leaves.
Pose: Sitting relaxed on the circular base, enjoying its boba tea with a happy expression.
Style: Laid-back and friendly, representing social connection and enjoying the moment.
`;

const codeMonkeyPrompt = `
${baseStyle}
Character: A clever and friendly capuchin monkey named 'Code Monkey', a tech guru.
Appearance: Bright, intelligent eyes, wearing stylish glasses perched on his nose.
Outfit: A small, open hoodie in banana-yellow over a t-shirt with a "less-than slash greater-than" code symbol on it.
Accessories: Holding a miniature laptop with a banana sticker on the back, and a utility belt with tiny gadgets.
Pose: Sitting cross-legged on the circular base, intently typing on his laptop with a focused but happy expression.
Style: Whimsical and smart, representing a master of technology.
`;

const artisanOwlPrompt = `
${baseStyle}
Character: A wise and creative snowy owl named 'Artisan Owl', a master of crafts.
Appearance: Large, perceptive eyes and soft, detailed feathers.
Outfit: Wearing a leather artist's apron with pockets holding brushes and tools. A small, elegant banana-shaped pendant hangs around her neck.
Accessories: One wing is holding a paintbrush, the other resting on a small, beautifully carved wooden banana.
Pose: Standing gracefully on the circular base, looking thoughtfully at her creation.
Style: Elegant and creative, representing artistic mastery.
`;

const captainCanaryPrompt = `
${baseStyle}
Character: A brave and adventurous canary named 'Captain Canary'.
Appearance: Bright yellow feathers, a determined look in his eye, and a tiny captain's hat tilted to one side.
Outfit: A small, custom-fit aviator's jacket in a deep blue, with a banana emblem on the lapel.
Accessories: Holding a miniature rolled-up treasure map tied with a vine, and a small compass hanging from his belt.
Pose: Standing proudly on the circular base, one foot forward, as if ready to lead an expedition.
Style: Daring and charismatic, representing leadership and adventure.
`;

const bananaDragonPrompt = `
${baseStyle}
Character: A wise and ancient dragon named 'Banana Sage', the ultimate guardian.
Appearance: Scales that shimmer like gold, with a crest of horns shaped like a crown of bananas. Its eyes glow with ancient wisdom.
Outfit: Wears ornate, golden bracers on its front legs, etched with banana-leaf patterns.
Accessories: A large, glowing banana-shaped crystal floats just in front of its snout. Its long tail is curled around the circular base.
Pose: Seated in a majestic, dignified pose, looking sagely forward.
Style: Epic and legendary, representing the pinnacle of wisdom and power.
`;

async function generateImage(ai, prompt, filename) {
  console.log(`Generating image for: ${filename}`);
  try {
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash-image-preview", contents: prompt });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        fs.writeFileSync(filename, buffer);
        console.log(`Successfully created ${filename}`);
      }
    }
  } catch (error) {
    console.error(`Error generating image for ${filename}:`, error);
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in your .env file");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Generate all character images
  await generateImage(ai, otterPupPrompt, "public/banana-splash.png");
  await generateImage(ai, sproutMolePrompt, "public/sprout-mole.png");
  await generateImage(ai, fennecFoxPrompt, "public/desert-dash.png");
  await generateImage(ai, redPandaPrompt, "public/bamboo-breeze.png");
  await generateImage(ai, codeMonkeyPrompt, "public/code-monkey.png");
  await generateImage(ai, artisanOwlPrompt, "public/artisan-owl.png");
  await generateImage(ai, captainCanaryPrompt, "public/captain-canary.png");
  await generateImage(ai, bananaDragonPrompt, "public/banana-sage.png");
  
  console.log("All character images generated successfully!");
}

main();