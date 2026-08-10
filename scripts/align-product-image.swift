import Foundation
import CoreGraphics
import ImageIO

// Map the transparent product silhouette onto the same visible bounds as the
// light product photograph. The two files keep a shared 740 x 1120 canvas;
// only the dark raster's internal placement is corrected.
let args = CommandLine.arguments
guard args.count == 3 else {
  fputs("usage: align-product-image.swift <input> <output.png>\n", stderr)
  exit(2)
}

let sourceURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])
let canvasWidth = 740
let canvasHeight = 1120
// The light photograph's physical front plate (not its soft floor shadow)
// occupies the stable display-aligned box x=50...675 and y=62...976 in the
// browser raster. The y coordinate is inverted here because CoreGraphics
// starts at the bottom of the canvas. Keeping the display and outer frame in
// this box removes sub-pixel drift during a theme write without scaling the
// cutout into the photograph's floor shadow.
let targetRect = CGRect(x: 50, y: 143, width: 626, height: 915)

guard let imageSource = CGImageSourceCreateWithURL(sourceURL as CFURL, nil),
      let sourceImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil),
      let sourceContext = CGContext(data: nil,
                                    width: canvasWidth,
                                    height: canvasHeight,
                                    bitsPerComponent: 8,
                                    bytesPerRow: 0,
                                    space: CGColorSpaceCreateDeviceRGB(),
                                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let outputContext = CGContext(data: nil,
                                    width: canvasWidth,
                                    height: canvasHeight,
                                    bitsPerComponent: 8,
                                    bytesPerRow: 0,
                                    space: CGColorSpaceCreateDeviceRGB(),
                                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else {
  fputs("unable to decode or allocate image contexts\n", stderr)
  exit(1)
}

sourceContext.clear(CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
sourceContext.draw(sourceImage, in: CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
guard let sourcePixels = sourceContext.data?.assumingMemoryBound(to: UInt8.self) else {
  fputs("unable to read source pixels\n", stderr)
  exit(1)
}

let sourceWidth = sourceImage.width
let sourceHeight = sourceImage.height
var minX = sourceWidth
var minY = sourceHeight
var maxX = -1
var maxY = -1
let sourceStride = sourceContext.bytesPerRow
for y in 0..<sourceHeight {
  for x in 0..<sourceWidth {
    let alpha = sourcePixels[y * sourceStride + x * 4 + 3]
    if alpha < 12 { continue }
    minX = Swift.min(minX, x)
    minY = Swift.min(minY, y)
    maxX = Swift.max(maxX, x)
    maxY = Swift.max(maxY, y)
  }
}

guard maxX >= minX, maxY >= minY else {
  fputs("source has no visible pixels\n", stderr)
  exit(1)
}

outputContext.clear(CGRect(x: 0, y: 0, width: canvasWidth, height: canvasHeight))
outputContext.interpolationQuality = .high
let sourceRect = CGRect(x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1)
guard let sourceCGImage = sourceContext.makeImage(),
      let croppedSource = sourceCGImage.cropping(to: sourceRect) else {
  fputs("unable to crop source image\n", stderr)
  exit(1)
}
outputContext.draw(croppedSource, in: targetRect)

guard let outputImage = outputContext.makeImage(),
      let destination = CGImageDestinationCreateWithURL(outputURL as CFURL, "public.png" as CFString, 1, nil) else {
  fputs("unable to encode output image\n", stderr)
  exit(1)
}
CGImageDestinationAddImage(destination, outputImage, [
  kCGImagePropertyPNGCompressionFilter: 0,
] as CFDictionary)
guard CGImageDestinationFinalize(destination) else {
  fputs("unable to finalize output image\n", stderr)
  exit(1)
}
print("aligned visible bounds \(sourceRect) -> \(targetRect)")
