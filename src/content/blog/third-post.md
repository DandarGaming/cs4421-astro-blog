---
title: "Out of the Cloud, Into the Closet"
description: "Why I moved away from paid cloud services and started running my own homelab: Jellyfin for media, Immich for photos and video, and a WireGuard-tunneled ad blocker for the network."
pubDate: 2026-10-28
author: dandar
heroImage: '../../assets/mybody.png'
---

For a while I treated almost everything as a subscription. Music in one service, photos in another, movies somewhere else, and enough cloud storage to make the whole thing feel endless. It was convenient. It was also getting expensive in a way that was hard to pin down until I started paying attention to it.

The change did not begin as a principled stand against the cloud. It began with the same feeling that sent me down the physical-media path in ["Physical Media, the Way to Go."](https://d1wb73pnm22nqf.cloudfront.net/blog/first-post/) I wanted to own the thing again. Not lease it, not stream it with the option to lose it, and not keep paying for the privilege of accessing something I had already paid for.

That feeling is what pushed me toward a homelab.

The first piece was media. I run Jellyfin on a small local server for movies, shows, and music. Before that, a lot of my media lived in the usual places, and yes, that included the kind of torrenting most people pretend they do not do. I am not going to write a guide on how to pirate anything. What I will say is that once you start collecting media locally, the conversation changes. The files are yours. They do not disappear because a service lost the rights. They do not require a monthly payment to keep watching. If I want to build a library that actually lasts, it has to live somewhere I control.

Jellyfin is the part that made that library usable. It is not flashy, and it does not try to be. It plays the files, organizes them, and lets me get to them from the devices I actually use. The setup is simple in the way most simple things are only after you have already spent time making it work. Once it was running, though, it felt less like a replacement for a streaming service and more like getting my own shelf back.

Photos and video came next. I moved those into Immich because I wanted something that felt close to the cloud photo apps I was using before, but without handing over all of it. Immich is not perfect, and I have no interest in pretending it is. It has its good days and its annoying days. What matters to me is that my photos and videos are on hardware I can touch, and that I can still search, scroll, and share them without logging into yet another service. For a person who takes a lot of random screenshots and half-finished photos, that made a bigger difference than I expected.

The part I am happiest with is not the media at all. It is the network.

I run a local ad blocker and tunnel web traffic through it with WireGuard. The idea is simple: instead of letting every device on its own ask the internet for whatever it wants, I send the traffic through a server that can drop the junk before it reaches anything else. That means fewer ads, fewer trackers, and a lot less noise from the things that had quietly turned the internet into a crowded room. I like the way it feels to have the house network do some of the work for me. It is one of those changes that is hard to describe until you have lived with it for a week.

This is not a post about being a privacy zealot. I am not. I am just someone who got tired of paying for the same convenience in five different forms and wanted to see what happened if I stopped outsourcing everything.

The homelab is not elegant. It is racks of old hardware, a mess of cables, and more services than I probably need. Some of them are there because they are useful. Some of them are there because I wanted to learn how they worked. That is the point, really. I did not build this to be tidy. I built it because I wanted to understand what I was using instead of trusting it by default.

There is a strange satisfaction in that. When something breaks now, I know where to look. When I want to watch a movie, I do not open five apps to figure out where it is. When I want to see a photo from months ago, it is not buried behind a service that may or may not still exist. I have made the whole thing more work to maintain, in one sense. In another sense, I have made it easier to live with.

I still use the cloud. Of course I do. I would not pretend otherwise. But I moved the parts that mattered most to me out of it. Media I want to keep. Photos I do not want to lose. A network I would rather control than trust.

The closet is full now. The services keep running. And every so often I remind myself that this whole thing started because I wanted my stuff back.
