import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { PlayCircle, ListVideo } from "lucide-react";

type Lecture = {
	id?: string;
	Title?: string;
	Link?: string;
	series?: string;
};

export default function Courses() {
	const [lectures, setLectures] = useState<Array<Lecture>>([]);
	const [selected, setSelected] = useState<Lecture | null>(null);
	const [error, setError] = useState<string | null>(null);

	function getEmbedUrl(link: string) {
		if (!link) return "";
		try {
			// YouTube formats: https://www.youtube.com/watch?v=ID, https://youtu.be/ID, /embed/ID
			const u = new URL(link);
			if (u.hostname.includes("youtu.be")) {
				return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
			}
			if (u.hostname.includes("youtube.com")) {
				const v = u.searchParams.get("v");
				if (v) return `https://www.youtube.com/embed/${v}`;
				// maybe already embed path
				if (u.pathname.includes("/embed/")) return link;
			}
			// fallback: return the original link (may work for other providers)
			return link;
		} catch (e) {
			// not a full URL, try heuristics
			const match = link.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
			if (match) return `https://www.youtube.com/embed/${match[1]}`;
			return link;
		}
	}

	useEffect(() => {
		async function fetchCourses() {
			try {
				const q = query(collection(db, "courses"), orderBy("createdAt", "desc"));
				const snapshot = await getDocs(q);
				const rows: Array<Lecture> = snapshot.docs.map(doc => ({
					id: doc.id,
					Title: doc.data().Title || "Untitled Course",
					Link: doc.data().Link || "",
					series: doc.data().series || "General Lectures"
				}));

				if (rows.length === 0) {
					setError("No courses available at the moment. Please check back later.");
					return;
				}

				setLectures(rows);
				setSelected(rows[0]);
			} catch (err) {
				console.error("Error fetching courses:", err);
				setError("Failed to load courses from database.");
			}
		}

		fetchCourses();
	}, []);

	const [selectedSeries, setSelectedSeries] = useState<string>("All Videos");
	
	const seriesList = ["All Videos", ...Array.from(new Set(lectures.map(l => l.series || "General Lectures")))];
	
	const filteredLectures = selectedSeries === "All Videos" 
		? lectures 
		: lectures.filter(l => (l.series || "General Lectures") === selectedSeries);

	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			<main className="flex-1 container mx-auto px-4 py-8">
				<div className="max-w-7xl mx-auto">
					<h1 className="text-3xl font-bold mb-8">Courses & Lectures</h1>

					{error ? (
						<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded mb-6">
							<p className="text-yellow-800">{error}</p>
						</div>
					) : null}

					<div className="flex flex-col md:flex-row gap-8">
						{/* SIDEBAR PLAYLISTS */}
						<aside className="w-full md:w-64 shrink-0 space-y-2">
							<h2 className="font-semibold text-lg mb-4 flex items-center text-gray-900 border-b pb-2">
								<ListVideo className="w-5 h-5 mr-2 text-primary" /> Playlists
							</h2>
							<div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible space-x-2 md:space-x-0 md:space-y-1 pb-4 md:pb-0 scrollbar-hide">
								{seriesList.map(series => (
									<button
										key={series}
										onClick={() => { 
											setSelectedSeries(series); 
											// Automatically select the first video of the new playlist
											const firstVid = series === "All Videos" ? lectures[0] : lectures.find(l => (l.series || "General Lectures") === series);
											setSelected(firstVid || null); 
										}}
										className={`whitespace-nowrap text-left px-4 py-3 md:py-2 rounded-lg transition-colors text-sm ${
											selectedSeries === series 
											? "bg-primary text-primary-foreground font-medium shadow-sm" 
											: "hover:bg-muted text-gray-700 font-medium"
										}`}
									>
										{series}
									</button>
								))}
							</div>
						</aside>

						{/* MAIN CONTENT */}
						<div className="flex-1 min-w-0 flex flex-col gap-8">
							
							{/* Video player area */}
							{selected ? (
								<section className="bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-gray-200">
									<AspectRatio ratio={16 / 9} style={{ width: "100%" }}>
										<iframe
											title={selected.Title || "video-player"}
											src={getEmbedUrl((selected.Link || selected.YouTube || "").toString())}
											frameBorder={0}
											allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
											allowFullScreen
											className="w-full h-full"
										/>
									</AspectRatio>
									<div className="p-4 bg-white dark:bg-slate-900 border-t">
										<h2 className="text-xl font-bold">{selected.Title || "Untitled"}</h2>
										<p className="text-sm text-primary font-medium mt-1">{selected.series || "General Lectures"}</p>
									</div>
								</section>
							) : null}

							{/* Video Grid */}
							<section>
								<div className="mb-4 flex items-center justify-between">
									<h2 className="text-2xl font-bold">{selectedSeries}</h2>
									<span className="text-sm font-medium bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
										{filteredLectures.length} videos
									</span>
								</div>

								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
									{filteredLectures.length === 0 && !error ? (
										<div className="col-span-full py-8 text-center text-sm text-muted-foreground bg-gray-50 rounded-lg border border-dashed">
											No videos in this playlist yet.
										</div>
									) : (
										filteredLectures.map((l, idx) => {
											const title = l.Title || "Untitled";
											const link = (l.Link || l.YouTube || "").toString();
											const isSelected = selected && selected.Link === link && selected.Title === title;
											return (
												<article
													key={idx}
													className={`group cursor-pointer overflow-hidden transition-all rounded-xl border ${
														isSelected ? "border-primary ring-1 ring-primary shadow-md" : "bg-white hover:shadow-lg hover:border-gray-300"
													}`}
													onClick={() => {
														link && setSelected(l);
														window.scrollTo({ top: 0, behavior: 'smooth' });
													}}
												>
													<div className="aspect-video bg-gray-100 relative">
														{/* We don't have thumbnails, so we show a nice placeholder */}
														<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 group-hover:opacity-80 transition-opacity">
															<PlayCircle className={`w-12 h-12 ${isSelected ? "text-primary" : "text-orange-300 group-hover:text-primary transition-colors"}`} />
														</div>
													</div>
													<div className="p-4">
														<h3 className="text-base font-semibold line-clamp-2 mb-1 group-hover:text-primary transition-colors">{title}</h3>
														<p className="text-xs text-muted-foreground font-medium">{l.series || "General Lectures"}</p>
													</div>
												</article>
											);
										})
									)}
								</div>
							</section>

						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
