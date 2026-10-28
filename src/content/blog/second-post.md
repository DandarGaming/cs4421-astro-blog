---
title: "Dithering, Pixel by Pixel"
description: "A first look at the dithering application I am building, and the physical-media experiment that sent me down this path."
pubDate: 2026-10-28
author: dandar
heroImage: '../../assets/background2.png'
---

A few months ago I made a small digital-art piece that started as a Greek statue and ended up as a layered, dithered poster. That piece became the first entry in this blog: ["Physical Media, the Way to Go."](https://d1wb73pnm22nqf.cloudfront.net/blog/first-post/) I wrote it mostly to capture a mood, but it had a side effect I did not expect: I kept coming back to the idea of turning an image into something you could almost feel as a physical object.

That post is the reason I am starting this dithering application.

The app is still early. Right now it is mostly a place for me to experiment with different dithering approaches—ordered dithering, error diffusion, and variations on those—without having to open Photoshop every time. The first version does not do much beyond loading an image, letting me pick a palette and a method, and exporting the result. That is enough for now. Most of what I am learning comes from the places where the output looks wrong.

The dithering itself is the part I am most interested in. When you reduce an image to a smaller palette, you have to decide what to throw away. A simple threshold loses a lot. Ordered dithering introduces a pattern that spreads the error over a fixed grid. Error diffusion pushes the leftover error into neighboring pixels, which is why it tends to give that grainy, almost-printed look. I have been playing with both, and with combining them in ways that do not make much sense on paper but look right in an image.

One thing I have found is that dithering is less about the algorithm than the whole pipeline around it. The same image, dithered with the same settings, can feel completely different depending on the palette, the output size, and even the paper or screen you view it on. That is probably why the physical-media thread from my first blog post keeps coming up. The goal was never really to make a perfect copy. It was to make something that looked like a decision had been made.

That is also why I have not rushed to add the obvious features. A slider for the dither strength is easy to build. A tool that helps you choose a palette worth dithering into is harder, and I think it matters more. I have been spending more time looking at palettes than at the dithering code itself. For now the app is a sketchbook: load something, break it, try again, export the interesting results.

I expect the next steps to be small. Better palette handling. A clearer way to compare two versions side by side. Maybe a way to chain a few passes together without making the whole thing unreadable. If it grows into something more useful than a toy, that will be a nice surprise. If not, it is still a good excuse to keep making posters.

The project lives in pieces. The code is on GitHub, and the README there will have the more technical side of the current state. This post is mostly the part I would have written down anyway: why I started it, and why I am not finished yet.
