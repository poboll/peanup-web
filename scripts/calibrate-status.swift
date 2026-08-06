import Foundation
import CoreGraphics
import ImageIO

// Calibrate only the left 9:41 glyphs in the transparent status strip.
// The right-side cellular, Wi-Fi and battery glyphs remain byte-for-byte in place.
let args = CommandLine.arguments
guard args.count >= 3,
      let shift = Int(args[2]) else {
  fputs("usage: swift calibrate-status.swift <input.png> <shift-source-pixels> [output.png]\n", stderr)
  exit(2)
}
let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args.count > 3 ? args[3] : args[1])
guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
  fputs("unable to decode PNG\n", stderr)
  exit(1)
}

let width = image.width
let height = image.height
var pixels = [UInt8](repeating: 0, count: width * height * 4)
guard let context = CGContext(data: &pixels,
                              width: width,
                              height: height,
                              bitsPerComponent: 8,
                              bytesPerRow: width * 4,
                              space: CGColorSpaceCreateDeviceRGB(),
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
  fputs("unable to create bitmap context\n", stderr)
  exit(1)
}
context.draw(image, in: CGRect(x: 0, y: 0, width: width, height: height))

// The current text bounds are x=193..288, y=66..105 on the 1056x163 strip.
// Keep a generous horizontal clear box so this tool can be run repeatedly
// without leaving the previous glyph behind. The right-side glyphs start at
// x=790, so this region remains well clear of them.
let sourceRect = CGRect(x: 128, y: 60, width: 192, height: 54)
let rowStride = width * 4
let minX = max(0, Int(sourceRect.minX))
let maxX = min(width, Int(sourceRect.maxX))
let minY = max(0, Int(sourceRect.minY))
let maxY = min(height, Int(sourceRect.maxY))
var shifted = pixels
for y in minY..<maxY {
  let row = y * rowStride
  for x in minX..<maxX {
    let offset = row + x * 4
    shifted[offset] = 0
    shifted[offset + 1] = 0
    shifted[offset + 2] = 0
    shifted[offset + 3] = 0
  }
}
for y in minY..<maxY {
  let row = y * rowStride
  for x in minX..<maxX {
    let destinationX = x + shift
    if destinationX < 0 || destinationX >= width { continue }
    let sourceOffset = row + x * 4
    let destinationOffset = row + destinationX * 4
    shifted[destinationOffset] = pixels[sourceOffset]
    shifted[destinationOffset + 1] = pixels[sourceOffset + 1]
    shifted[destinationOffset + 2] = pixels[sourceOffset + 2]
    shifted[destinationOffset + 3] = pixels[sourceOffset + 3]
  }
}

guard let outputContext = CGContext(data: &shifted,
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
print("wrote \(outputURL.path) with time shift \(shift) source pixels")
