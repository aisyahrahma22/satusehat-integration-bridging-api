import * as crypto from "crypto";
import * as lzstring from "lz-string";

// Function to generate a signature based on salt and secret key
export function generateSignature(salt: string, secretKey: string) {
  // Compute the current timestamp
  const timestamp: string = Math.floor(Date.now() / 1000).toString();

  // Create the signature data by combining salt and timestamp
  const signatureData: string = `${salt}&${timestamp}`;
  
  // Generate the HMAC signature
  const signature: Buffer = crypto
    .createHmac("sha256", secretKey)
    .update(signatureData)
    .digest();

  // Encode the signature in base64
  const encodedSignature: string = signature.toString("base64");

  return {
    encodedSignature,
    timestamp,
  };
}

// Function to decrypt a given encrypted string
export function decryptResponse(
  encryptedText: string,
  timestamp: string,
  consumerId: string,
  secretKey: string
): string {
  try {
    // Combine consumer ID, secret key, and timestamp to create the decryption key
    const key = `${consumerId}${secretKey}${timestamp}`;
    const keyHash = crypto.createHash("sha256").update(key, "utf-8").digest();
    
    // Define encryption mode
    const mode = "aes-256-cbc";
    
    // Create decipher with the key and initialization vector (IV)
    const decipher = crypto.createDecipheriv(
      mode,
      keyHash.slice(0, 32), // Key must be 32 bytes for AES-256
      keyHash.slice(0, 16)  // IV must be 16 bytes for AES
    );
    decipher.setAutoPadding(false); // Disable automatic padding
    
    // Decrypt the data
    const encryptedData = Buffer.from(encryptedText, "base64");
    let plainText = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);

    // Manually remove padding (if using PKCS#7)
    const paddingLength = plainText[plainText.length - 1];
    plainText = plainText.slice(0, plainText.length - paddingLength);

    // Decompress the data
    const decompressedText = lzstring.decompressFromEncodedURIComponent(
      plainText.toString("utf-8")
    );

    return decompressedText;
  } catch (error) {
    console.error("Error decrypting data:", error);
    return ""; // Return empty string or handle the error based on your use case
  }
}
