CREATE TABLE `bookingRequests` (
	`id` varchar(32) NOT NULL,
	`name` varchar(120) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`serviceId` varchar(32) NOT NULL,
	`date` varchar(10) NOT NULL,
	`time` varchar(12) NOT NULL,
	`location` enum('studio','mobile') NOT NULL,
	`hairOption` enum('bring-own','brathouse') NOT NULL,
	`addOnsJson` text NOT NULL,
	`note` varchar(500),
	`servicePriceCents` int NOT NULL,
	`depositCents` int NOT NULL,
	`status` enum('awaiting_deposit','confirmed','cancelled') NOT NULL DEFAULT 'awaiting_deposit',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookingRequests_id` PRIMARY KEY(`id`)
);
