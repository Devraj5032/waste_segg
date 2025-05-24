"use client"

import { useState, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Camera, CameraOff, RotateCcw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WasteClassification() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<"cleaned" | "not-cleaned" | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "environment", // Use back camera on mobile
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCameraActive(true)
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions and try again.")
      console.error("Camera error:", err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }, [stream])

  const captureImage = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64
    const base64Image = canvas.toDataURL("image/jpeg", 0.8)
    setCapturedImage(base64Image)

    // Stop camera after capture
    stopCamera()

    // Analyze the captured image
    await analyzeImage(base64Image)
  }, [stopCamera])

  const analyzeImage = async (base64Image: string) => {
    setError(null)
    setResult(null)
    setIsLoading(true)

    try {
      const response = await fetch(
        "https://detect.roboflow.com/garbage-detector-ccn0g/1?api_key=P0IdQ8jZWlbmmKyNSMwg",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: base64Image,
        },
      )

      if (!response.ok) {
        throw new Error("Failed to analyze image")
      }

      const data = await response.json()

      // Check if garbage was detected
      if (data.predictions && data.predictions.length > 0) {
        setResult("not-cleaned")
      } else {
        setResult("cleaned")
      }
    } catch (err) {
      setError("Failed to analyze image. Please try again.")
      console.error("Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const resetCapture = () => {
    setCapturedImage(null)
    setResult(null)
    setError(null)
    setIsLoading(false)
    stopCamera()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Camera className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Waste Classification</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Use your camera to capture an image and classify waste. Our AI will analyze the image and determine if the
            area contains garbage or is clean.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Camera Section */}
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Camera Capture
              </CardTitle>
              <CardDescription>Take a photo to analyze for waste classification</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!isCameraActive && !capturedImage && (
                  <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                    <Camera className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="text-gray-500 text-center mb-4">Ready to capture image</p>
                    <Button onClick={startCamera} className="bg-green-600 hover:bg-green-700">
                      <Camera className="w-4 h-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}

                {isCameraActive && (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={captureImage} className="flex-1 bg-green-600 hover:bg-green-700">
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Image
                      </Button>
                      <Button onClick={stopCamera} variant="outline">
                        <CameraOff className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={capturedImage || "/placeholder.svg"}
                        alt="Captured for analysis"
                        className="w-full h-64 object-cover"
                      />
                    </div>
                    <Button onClick={resetCapture} variant="outline" className="w-full" disabled={isLoading}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Take New Photo
                    </Button>
                  </div>
                )}

                {/* Hidden canvas for image capture */}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle>Classification Results</CardTitle>
              <CardDescription>AI-powered waste detection and classification</CardDescription>
            </CardHeader>
            <CardContent>
              {!capturedImage && !isLoading && (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Camera className="h-12 w-12 mb-2 opacity-50" />
                  <p>Capture an image to see classification results</p>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center h-32">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                  <p className="text-gray-600">Analyzing image...</p>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {result && !isLoading && (
                <div className="space-y-4">
                  {result === "cleaned" ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 font-medium">
                        ✅ Clean Area! No waste detected.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="font-medium">
                        ❌ Waste Detected! Classification: Garbage present.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
