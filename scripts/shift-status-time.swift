import Foundation
import CoreGraphics
import ImageIO

// Move only the 9:41 glyph in an already calibrated transparent status strip.
// The right-side cellular, Wi-Fi and battery indicators remain untouched.
let args = CommandLine.arguments
guard args.count >= 4,
      let shift = Int(args[3]) else {
  fputs("usage: swift shift-status-time.swift <input.png> <output.png> <shift-source-pixels>\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
  fputs("unable to decode PNG\n", stderr)
  exit(1)
}

let width = image.width
let height = image.height
let rowStride = width * 4
var pixels = [UInt8](repeating: 0, count: width * height * 4)
guard let context = CGContext(data: &pixels,
                              width: width,
                              height: height,
                              bitsPerComponent: 8,
                              bytesPerRow: rowStride,
                              space: CGColorSpaceCreateDeviceRGB(),
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
  fputs("unable to create bitmap context\n", stderr)
  exit(1)
}
context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

// The calibrated source uses a 192 x 54 px clear box around the time glyph.
// It is well clear of the indicators, which begin around x=742 in the final
// strip, so moving this region cannot touch the right-side status group.
let timeRect = CGRect(x: 40, y: 60, width: 192, height: 54)
let minX = max(0, Int(timeRect.minX))
let maxX = min(width, Int(timeRect.maxX))
let minY = max(0, Int(timeRect.minY))
let maxY = min(height, Int(timeRect.maxY))
let original = pixels

for y in minY..<maxY {
  let row = y * rowStride
  for x in minX..<maxX {
    let offset = row + x * 4
    pixels[offset] = 0
    pixels[offset + 1] = 0
    pixels[offset + 2] = 0
    pixels[offset + 3] = 0
  }
}

for y in minY..<maxY {
  let row = y * rowStride
  for x in minX..<maxX {
    let destinationX = x + shift
    if destinationX < 0 || destinationX >= width { continue }
    let sourceOffset = row + x * 4
    let destinationOffset = row + destinationX * 4
    pixels[destinationOffset] = original[sourceOffset]
    pixels[destinationOffset + 1] = original[sourceOffset + 1]
    pixels[destinationOffset + 2] = original[sourceOffset + 2]
    pixels[destinationOffset + 3] = original[sourceOffset + 3]
  }
}

guard let outputContext = CGContext(data: &pixels,
                                    width: width,
                                    height: height,
                                    bitsPerComponent: 8,
                                    bytesPerRow: rowStride,
                                    space: CGColorSpaceCreateDeviceRGB(),
                                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let outputImage = outputContext.makeImage(),
      let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, "public.png" as CFString, 1, nil) else {
  fputs("unable to encode PNG\n", stderr)
  exit(1)
}

CGImageDestinationAddImage(destination, outputImage, [
  kCGImagePropertyPNGCompressionFilter: 0
] as CFDictionary)
guard CGImageDestinationFinalize(destination) else {
  fputs("unable to finalize PNG\n", stderr)
  exit(1)
}
print("wrote \(outputURL.path) with time-only shift \(shift) source pixels")
