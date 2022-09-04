import React, { useState } from "react";
import refurbishedUnits from "./refurbishedUnits";
import Service from "./Service";

function App() {
	const [railServices, setRailServices] = useState<Service[]>([]);
	const [searching, setSearching] = useState<boolean>(false);
	const [station, setStation] = useState<string>("");

	return (
		<div className="container my-4">
			<h1>Search For a Refurbished Pendolino</h1>
			<div className="row">
				<div className="col-sm-6 col-md-4 col-lg-3">
					<div className="mb-3 form-floating">
						<input
							onChange={(e) => setStation(e.target.value)}
							value={station}
							id="station"
							name="station"
							type="text"
							className="form-control"
							placeholder="Station"
							maxLength={3}
							minLength={3}
							autoComplete="off"
						/>
						<label htmlFor="station">Station Code (e.g. BHM)</label>
					</div>
					<button
						type="submit"
						className="btn btn-primary"
						onClick={async () => {
							if (station.length !== 3) return;

							setSearching(true);
							setRailServices([]);

							const date = new Date();
							const trainSearchRequest = await fetch(
								`https://www.realtimetrains.co.uk/search/detailed/gb-nr:${station.toUpperCase()}/${
									date.toISOString().split("T")[0]
								}/0200-0159?stp=WVS&show=all&order=wtt&toc=VT`}
							);
							const trainSearchString =
								await trainSearchRequest.text();
							let services = trainSearchString.split(
								'<a class="service " href="'
							);
							let modifiedServices = [];

							for (const service of services) {
								const split = service.split(
									'<a class="service origin" href="'
								);
								modifiedServices.push(...split);
							}

							services = modifiedServices;

							services.splice(0, 1);
							for (const service of services) {
								const index = services.indexOf(service);
								services[index] =
									"https://realtimetrains.co.uk" +
									service.split('"')[0];
							}

							let refurbishedOperatedServices = [];

							for (const service of services) {
								const serviceRequest = await fetch(service);
								const serviceString =
									await serviceRequest.text();
								for (const refurbishedUnit of refurbishedUnits) {
									if (
										serviceString.includes(
											`390${refurbishedUnit}`
										)
									) {
										const serviceRunning =
											"Running service: " +
											serviceString
												.split(
													'<div class="header" role="text">'
												)[1]
												.split("</div>")[0]
												.replace("<small>", "")
												.replace("</small>", "");

										console.log(
											`Found refurbished service operated with 390 ${refurbishedUnit}!`
										);
										console.log(serviceRunning);
										console.log(
											"-".repeat(serviceRunning.length)
										);
										refurbishedOperatedServices.push([
											serviceRunning,
											service,
											refurbishedUnit,
										]);
										break;
									}
								}
								// await new Promise(r => setTimeout(r, 100));
							}

							let finalServices = [];

							for (const [
								service,
								link,
								unit,
							] of refurbishedOperatedServices) {
								const sArgs = service.split(" ");
								let startStation = "";
								let finishStation = "";

								let beganSecond = false;

								for (const arg of sArgs) {
									if (sArgs.indexOf(arg) <= 3) continue;
									if (arg === "to") {
										beganSecond = true;
										continue;
									}

									if (beganSecond) {
										finishStation += " " + arg;
										continue;
									}
									startStation += " " + arg;
								}

								startStation.trim();
								finishStation.trim();

								finalServices.push({
									time: sArgs[3],
									start: startStation,
									finish: finishStation,
									unit: "390 " + unit,
									rtt: link,
								});
							}

							setRailServices(finalServices);
							setSearching(false);
						}}
					>
						{searching ? "Searching" : "Search"}{" "}
						{searching && (
							<span
								className="spinner-border spinner-border-sm"
								role="status"
								aria-hidden="true"
							/>
						)}
					</button>
				</div>
			</div>
			{railServices.length > 0 && (
				<>
					<hr />
					<table className="table">
						<thead>
							<tr>
								<th scope="col">Departs Start Station</th>
								<th scope="col">From</th>
								<th scope="col">Destination</th>
								<th scope="col">Unit</th>
								<th scope="col">RTT Link</th>
							</tr>
						</thead>
						<tbody>
							{railServices.map((x) => (
								<tr>
									<th scope="row">{x.time}</th>
									<td>{x.start}</td>
									<td>{x.finish}</td>
									<td>{x.unit}</td>
									<td>
										<a href={x.rtt}>Click</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</>
			)}
		</div>
	);
}

export default App;



