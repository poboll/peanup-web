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

// The source time glyph is moved to x=88..183, y=66..105 on the 1056x163
// strip, then the complete strip is optically shifted left to match the
// right-side indicators. A final time-only pass moves 9:41 inward to
// x=150..245; the right-side status group remains byte-for-byte in place.
// The input should be the uncalibrated strip (the source glyph begins near
// x=193). Keep a generous horizontal clear box while moving it; the right-side
// glyphs start at x=790, so this region remains well clear of them.
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

// Move only the time glyph after the shared source correction. Keeping the
// indicator group fixed preserves the right safe area measured from the
// supplied reference capture.
let wholeStripShift = -48
var calibrated = [UInt8](repeating: 0, count: pixels.count)
for y in 0..<height {
  let row = y * rowStride
  for x in 0..<width {
    let destinationX = x + wholeStripShift
    if destinationX < 0 || destinationX >= width { continue }
    let sourceOffset = row + x * 4
    let destinationOffset = row + destinationX * 4
    calibrated[destinationOffset] = shifted[sourceOffset]
    calibrated[destinationOffset + 1] = shifted[sourceOffset + 1]
    calibrated[destinationOffset + 2] = shifted[sourceOffset + 2]
    calibrated[destinationOffset + 3] = shifted[sourceOffset + 3]
  }
}

// The first calibration balanced the right-side indicators but left the time
// too close to the display edge. Move only the time pixels inward; the clear
// box is kept away from the right group so no indicator can be overwritten.
let timeOnlyShift = 110
let timeRect = CGRect(x: 40, y: 60, width: 192, height: 54)
let timeMinX = max(0, Int(timeRect.minX))
let timeMaxX = min(width, Int(timeRect.maxX))
let timeMinY = max(0, Int(timeRect.minY))
let timeMaxY = min(height, Int(timeRect.maxY))
let timeSource = calibrated
var timeAligned = calibrated
for y in timeMinY..<timeMaxY {
  let row = y * rowStride
  for x in timeMinX..<timeMaxX {
    let offset = row + x * 4
    timeAligned[offset] = 0
    timeAligned[offset + 1] = 0
    timeAligned[offset + 2] = 0
    timeAligned[offset + 3] = 0
  }
}
for y in timeMinY..<timeMaxY {
  let row = y * rowStride
  for x in timeMinX..<timeMaxX {
    let destinationX = x + timeOnlyShift
    if destinationX < 0 || destinationX >= width { continue }
    let sourceOffset = row + x * 4
    let destinationOffset = row + destinationX * 4
    timeAligned[destinationOffset] = timeSource[sourceOffset]
    timeAligned[destinationOffset + 1] = timeSource[sourceOffset + 1]
    timeAligned[destinationOffset + 2] = timeSource[sourceOffset + 2]
    timeAligned[destinationOffset + 3] = timeSource[sourceOffset + 3]
  }
}

guard let outputContext = CGContext(data: &timeAligned,
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
print("wrote \(outputURL.path) with source shift \(shift), whole-strip shift \(wholeStripShift), and time-only shift \(timeOnlyShift) source pixels")
