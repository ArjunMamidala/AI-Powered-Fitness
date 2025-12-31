/**
 * FormChecker Component
 * 
 * AI-powered exercise form analysis using MediaPipe Pose Detection. 
 * Provides real-time feedback on squat form, counts reps, and displays visual overlays on the user's video feed. 
 * 
 * Technologies: 
 * - MediaPipe Pose for pose detection
 * - TensorFlow.js for any additional ML processing
 * - HTML5 Video and Canvas for rendering
 * - WebRTC for webcam access
 */

import React, { useRef, useEffect, useState } from 'react';
import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';

export default function FormChecker() {
    /**
     * Reference to the hidden video element that receives webcam feed
     * Sends webcam frames to MediaPipe Pose for processing
     */
    const videoRef = useRef(null);
    
    /**
     * Reference to the canvas element where pose overlays will be drawn
     */
    const canvasRef = useRef(null);
    
    /**
     * State to hold feedback messages for the user
     */
    const [feedback, setFeedback] = useState([]);

    /**
     * Total number of reps completed
     * Increments when the user completes a full squat
     */
    const [repCount, setRepCount] = useState(0);
     
    /**
     * Tracks whether the user is currently in the "down" position of a squat
     * Used to detect transitions for counting reps
     * Makes sure that a rep is only counted when user goes down and then back up and it prevents counting multiple reps while staying down
     */
    const [isSquatting, setIsSquatting] = useState(false);
     
    /**
     * Initialize MediaPipe Pose and Camera on component mount
     * 
     * This effect sets up the pose detection pipeline and starts the webcam feed.
     * 1. Creates a MediaPipe Pose instance with desired options
     * 2. Configures pose detection settings
     * 3. Sets up callback for when pose results are available
     * 4. Initializes the webcam using MediaPipe Camera utility
     */
     useEffect(() => {
        // Creates an instance of Pose AI model and locateFile tells where to load model files from
        const pose = new Pose({
            /**
             * Tell MediaPipe where to load model files from
             * Uses CDN for fast loading without local files
             * @param {string} file - The model file name
             * @returns {string} Full URL to load the model from
             */
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            }
        });

        /**
         * Configure pose detection options
         * 
         * modelComplexity: 1 for balanced accuracy and speed
         * smoothLandmarks: true to reduce jitter in landmark positions
         * enableSegmentation: false to skip segmentation for performance
         * minDetectionConfidence: 0.5 minimum confidence to detect pose
         * minTrackingConfidence: 0.5 minimum confidence to track pose
         */
        pose.setOptions({
            modelComplexity: 1,          // Balanced model for accuracy and speed
            smoothLandmarks: true,       // Smooth landmark positions over time
            enableSegmentation: false,   // Disable segmentation for performance
            smoothSegmentation: false,
            minDetectionConfidence: 0.5, // Minimum confidence to detect pose
            minTrackingConfidence: 0.5    // Minimum confidence to track pose
        });
        
        /**
         * Set callback function that runs every time pose is detected
         * This is called 30+ times per second with new pose data
         */
        pose.onResults(onResults);

        /**
         * Starts the camera and feeds video frames to MediaPipe Pose
         * Uses MediaPipe Camera utility for easy webcam access
         * Camera class handles:
         * - Accessing webcam
         * - Capturing frames
         * - Sending frames to the pose detector
         */
        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                /**
                 * Callback that runs for each camera frame
                 * Sends the current video frame to the pose detector
                 */
                onFrame: async () => {
                    await pose.send({ image: videoRef.current });
                },
                width: 640, // Video resolution width
                height: 480 // Video resolution height
            });
            camera.start();
        }

        }, []);

        /**
         * Callback function that runs when MediaPipe Pose detects pose landmarks
         * 
         * This is hte main processing function that:
         * 1. Draws pose landmarks on the canvas
         * 2. Analyzes squat form based on landmark positions
         * 3. Provides real-time feedback to the user
         * 4. Counts reps based on squat depth and transitions
         * 
         * @param {Object} results - The results object from MediaPipe Pose
         * @param {Array} results.poseLandmarks - Array of detected pose landmarks
         * @param {HTMLImageElement} results.image - The current video frame image
         * 
         * Landmark indices of interest for squat analysis:
         * - 24: Right Hip
         * - 26: Right Knee
         * - 28: Right Ankle
         * - 23: Left Hip
         * - 25: Left Knee
         * - 27: Left Ankle
         * - 11: Right Shoulder
         * - 12: Left Shoulder
         */
        function onResults(results) {
            // If no landmarks detected, skip processing
            if (!results.poseLandmarks) {
                return;
            }
            
            // Get canvas and its context for drawing
            const canvas = canvasRef.current;

            // Get canvas context for drawing
            const ctx = canvas.getContext('2d');

            // Save current canvas state
            ctx.save()

            // Clear previous drawings
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the current video frame as background
            ctx.drawImage(
                results.image, 0, 0, canvas.width, canvas.height
            );

            // Draw skeleton on top of video
            drawSkeleton(ctx, results.poseLandmarks);

            // Analyze squat form and provide feedback
            const analysis = analyzeSquatForm(results.poseLandmarks);

            // Update feedback state
            setFeedback(analysis.feedback);

            /**
             * A rep is counted when:
             * 1. User goes down below squat depth threshold
             * 2. Then comes back up above the threshold
             */
            if (analysis.isBelowSquatDepth && !isSquatting) {
                setIsSquatting(true);
            } else if (!analysis.isBelowSquatDepth && isSquatting) {
                setIsSquatting(false);
                setRepCount(prev => prev + 1); // Increment rep count
            }

            // Restore canvas state
            ctx.restore();   
        }

        /**
         * Calculate angle between three points
         * 
         * This is used to measure joint angles like knee bend. 
         * 
         * Math explanation:
         * 1. Create vectors AB and BC
         * 2. Use dot product formula to calculate angle
         * 3. Convert radians to degrees
         * 4. Return angle in degrees
         * 
         * Used to calculate joint angles for form analysis
         * @param {Object} A - First point {x, y} (hip)
         * @param {Object} B - Middle point {x, y}
         * @param {Object} C - Last point {x, y}
         * @returns {number} Angle in degrees
         */
        function calculateAngle(A, B, C) {
            const radians = Math.atan2(C.y - B.y, C.x - B.x) - 
                    Math.atan2(A.y - B.y, A.x - B.x);
            let angle = Math.abs(radians * 180.0 / Math.PI);
            if (angle > 180.0) {
                angle = 360 - angle;
            }
            return angle;
        }

        /**
         * Analyze squat form based on pose landmarks
         * 
         * This function checks key joint angles and positions to determine:
         * - If the user is squatting deep enough
         * - If the back is straight
         * - If knees are tracking over toes
         * 
         */
        function analyzeSquatForm(landmarks) {
            const feedbackMessages = [];

            // Get relevant landmarks
            const rightHip = landmarks[24];
            const rightKnee = landmarks[26];
            const rightAnkle = landmarks[28];
            const leftHip = landmarks[23];
            const leftKnee = landmarks[25];
            const leftAnkle = landmarks[27];
            const rightShoulder = landmarks[12];
            const leftShoulder = landmarks[11];

            /**
             * Calculate knee angles to assess squat depth
             * 
             * 170 degrees = standing straight
             * 120: Quarter squat (too high)
             * 90-110: Good squat depth
             * <90: Very deep squat
             */
            const rightKneeAngle = calculateAngle(
                rightHip, rightKnee, rightAnkle
            );
            const leftKneeAngle = calculateAngle(
                leftHip, leftKnee, leftAnkle
            );

            const avgKneeAngle = (rightKneeAngle + leftKneeAngle) / 2;

            /**
             * Calculate back angle
             * 
             * Creates imaginary line from hips to shoulders
             * Compares to vertical line to see if back is straight
             * 90: completely upright
             * 45-75: slight forward lean (good)
             * <45: too much forward lean
             */
            const backAngle = calculateAngle(
                { x: leftHip.x, y: leftHip.y - 0.1 },
                leftHip,
                leftShoulder
            );

            /**
             * Determine if user is at the proper squat depth
             * A squat is considered deep enough if average knee angle is <= 110 degrees
             */
            const isBelowSquatDepth = avgKneeAngle <= 135;

            // Check depth (only when squatting)
            if (isBelowSquatDepth) {
                if (avgKneeAngle > 110) {
                    feedbackMessages.push({
                        type: 'warning',
                        text: 'Go deeper! Not at parallel yet.'
                    });
                } else if (avgKneeAngle < 80) {
                    feedbackMessages.push({
                        type: 'warning',
                        text: 'Too deep - protect your knees!'
                    });
                } else {
                    feedbackMessages.push({
                        type: 'success',
                        text: '✓ Perfect depth!'
                    });
                }
            }

            // Check back angle (ALWAYS, not just when squatting)
            if (backAngle < 45) {
                feedbackMessages.push({
                    type: 'warning',
                    text: "Keep chest up - back too horizontal"
                });
            } else if (backAngle > 75) {
                feedbackMessages.push({
                    type: 'info',
                    text: "Lean forward slightly at hips"
                });
            } else if (isBelowSquatDepth) {  // Only give positive feedback when squatting
                feedbackMessages.push({
                    type: 'success',
                    text: "✓ Good back posture!"
                });
            }

            // Check knee tracking (ALWAYS)
            if (leftKnee.x - leftAnkle.x > 0.05) {
                feedbackMessages.push({
                    type: 'warning',
                    text: "Knees too far forward!"
                });
            }

            return {
                feedback: feedbackMessages,
                isBelowSquatDepth: isBelowSquatDepth
            };
        }

/**
 * Draw skeleton on canvas based on pose landmarks
 * 
 * Draws colored lines connecting body landmarks to create a skeleton overlay
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Array} landmarks - Array of pose landmarks
 */
function drawSkeleton(ctx, landmarks) {
        /**
         * Define which landmarks to connect with lines
         * 
         * Format: [startIndex, endIndex]
         * 
         * MediaPipe landmark indices:
         * - 11-12: Shoulders
         * - 13-16: Arms
         * - 23-24: Hips
         * - 25-28: Legs
         */
        const connections = [
            // Shoulders
            [11, 12],  // Left to right shoulder
            
            // Arms
            [11, 13],  // Left shoulder to elbow
            [13, 15],  // Left elbow to wrist
            [12, 14],  // Right shoulder to elbow
            [14, 16],  // Right elbow to wrist
            
            // Torso
            [11, 23],  // Left shoulder to hip
            [12, 24],  // Right shoulder to hip
            [23, 24],  // Left to right hip
            
            // Legs
            [23, 25],  // Left hip to knee
            [25, 27],  // Left knee to ankle
            [24, 26],  // Right hip to knee
            [26, 28]   // Right knee to ankle
        ];

        /**
         * Set line style for skeleton
         */
        ctx.strokeStyle = '#00FF00';  // Bright green
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

        /**
         * Get start and end landmarks
         * Check that both exist
         * Covert normalized coordinates to canvas pixels
         * Draw the line between the two points
         * Coordinates are normalized (0-1), multiply by canvas size
         */
        connections.forEach(([startIdx, endIdx]) => {
            const startPoint = landmarks[startIdx];
            const endPoint = landmarks[endIdx];

            // Only draw if both points exist
            if (!startPoint || !endPoint) return;

            ctx.beginPath();
            ctx.moveTo(
                startPoint.x * ctx.canvas.width,
                startPoint.y * ctx.canvas.height
            );
            ctx.lineTo(
                endPoint.x * ctx.canvas.width,
                endPoint.y * ctx.canvas.height
            );
            ctx.stroke();
        });

        /**
         * Draw circles at key joint positions
         */
        ctx.fillStyle = '#FF0000'; 
        const keyPoints = [11, 12, 23, 24, 25, 26, 27, 28];

        keyPoints.forEach(idx => {
            const point = landmarks[idx];
            if (!point) return;

            ctx.beginPath();
            ctx.arc(
                point.x * ctx.canvas.width,
                point.y * ctx.canvas.height,
                6, 
                0,
                2 * Math.PI
            );
            ctx.fill();
        });
    }

    /**
     * Component render
     * 
     * Layout:
     * - Left: Video feed with skeleton overlay + rep counter
     * - Right: Real-time feedback panel + form guide
     */
    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-4xl font-bold mb-6 text-center text-gray-800">
                AI Form Checker - Squats
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/*VIDEO SECTION*/}
                <div className="lg:col-span-2">
                    <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
                        
                        {/* Hidden video element */}
                        <video
                            ref={videoRef}
                            className="hidden"
                            playsInline
                        />
                        
                        {/* Canvas (video + skeleton overlay) */}
                        <canvas
                            ref={canvasRef}
                            width={640}
                            height={480}
                            className="w-full"
                        />
                        
                        {/* Rep counter overlay */}
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-6 py-3 rounded-lg backdrop-blur-sm">
                            <div className="text-sm text-gray-300">Reps</div>
                            <div className="text-5xl font-bold">{repCount}</div>
                        </div>

                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                            <div className="text-xs text-gray-300">Status</div>
                            <div className="text-sm font-semibold">
                                {isSquatting ? '🔴 Squatting' : '🟢 Standing'}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* ========== FEEDBACK PANEL ========== */}
                <div className="space-y-4">
                    
                    {/* Real-time feedback display */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            Real-time Feedback
                        </h2>
                        
                        {feedback.length === 0 ? (
                            // No feedback - show instructions
                            <div className="text-gray-500 text-center py-4">
                                <p className="mb-2">👤 Stand in front of camera</p>
                                <p>🏋️ Start squatting for feedback!</p>
                            </div>
                        ) : (
                            // Show feedback messages
                            <div className="space-y-2">
                                {feedback.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg font-medium ${
                                            item.type === 'success'
                                                ? 'bg-green-100 text-green-800'
                                                : item.type === 'warning'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}
                                    >
                                        {item.text}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Form guide reference */}
                    <div className="bg-blue-50 rounded-lg p-6 shadow">
                        <h3 className="font-semibold text-blue-900 mb-3">
                            Perfect Squat Form:
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>Feet shoulder-width apart</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>Knees track over toes</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>Chest up, back straight</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>Hips below parallel</span>
                            </li>
                            <li className="flex items-start">
                                <span className="mr-2">✓</span>
                                <span>Weight on heels</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
 