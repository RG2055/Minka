// Cuts the subject out of a picture with the Mac's own Vision (the same as
// "Lift subject from background" in Photos): nothing to download, nothing
// sent anywhere. Writes a PNG with the background transparent.
// --person keeps only people (a hand and its sleeve without what it holds).
//
//     swift scripts/cutout.swift IN.jpg OUT.png
//     swift scripts/cutout.swift --person IN.jpg OUT.png
import CoreImage
import Foundation
import ImageIO
import Vision

var args = Array(CommandLine.arguments.dropFirst())
let personOnly = args.first == "--person"
if personOnly { args.removeFirst() }
guard args.count >= 2 else { print("usage: swift scripts/cutout.swift [--person] IN OUT.png"); exit(1) }
guard let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: args[0]) as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { print("cannot read", args[0]); exit(1) }
let handler = VNImageRequestHandler(cgImage: image, options: [:])
let original = CIImage(cgImage: image)
var output: CIImage

if personOnly {
  let request = VNGeneratePersonSegmentationRequest()
  request.qualityLevel = .accurate
  request.outputPixelFormat = kCVPixelFormatType_OneComponent8
  try handler.perform([request])
  guard let mask = request.results?.first?.pixelBuffer else { print("no person found"); exit(2) }
  var maskImage = CIImage(cvPixelBuffer: mask)
  maskImage = maskImage.transformed(by: CGAffineTransform(scaleX: original.extent.width / maskImage.extent.width,
                                                          y: original.extent.height / maskImage.extent.height))
  let clear = CIImage(color: .clear).cropped(to: original.extent)
  output = original.applyingFilter("CIBlendWithMask", parameters: [kCIInputBackgroundImageKey: clear, kCIInputMaskImageKey: maskImage])
  print("person mask")
} else {
  let request = VNGenerateForegroundInstanceMaskRequest()
  try handler.perform([request])
  guard let result = request.results?.first else { print("no subject found"); exit(2) }
  print("subjects:", result.allInstances.count)
  let masked = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: false)
  output = CIImage(cvPixelBuffer: masked)
}
try CIContext().writePNGRepresentation(of: output, to: URL(fileURLWithPath: args[1]),
                                        format: .RGBA8, colorSpace: CGColorSpace(name: CGColorSpace.sRGB)!)
print("wrote", args[1])
