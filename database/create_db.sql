CREATE DATABASE `pool` /*!40100 DEFAULT CHARACTER SET utf8 */;

use pool;

CREATE TABLE `board_stats` (
  `id` int(11) NOT NULL,
  `board_id` int(11) DEFAULT NULL,
  `controller_ip` varchar(45) DEFAULT NULL,
  `hashrate` float DEFAULT NULL,
  `expected` float DEFAULT NULL,
  `eff` float DEFAULT NULL,
  `pdn` int(11) DEFAULT NULL,
  `hwe` float DEFAULT NULL,
  `ver` varchar(45) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `job_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `board_stats_archive` (
  `id` int(11) NOT NULL,
  `board_id` int(11) DEFAULT NULL,
  `controller_ip` varchar(45) DEFAULT NULL,
  `hashrate` float DEFAULT NULL,
  `expected` float DEFAULT NULL,
  `eff` float DEFAULT NULL,
  `pdn` int(11) DEFAULT NULL,
  `hwe` float DEFAULT NULL,
  `ver` varchar(45) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `job_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `controller_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) DEFAULT NULL,
  `online` tinyint(1) DEFAULT '0',
  `clock` smallint(6) DEFAULT NULL,
  `hashrate` float DEFAULT NULL,
  `expected` float DEFAULT NULL,
  `accepted` bigint(20) DEFAULT NULL,
  `rejected` bigint(20) DEFAULT NULL,
  `hwe` float DEFAULT NULL,
  `pdn` int(11) DEFAULT NULL,
  `diff` int(11) DEFAULT NULL,
  `uptime` int(11) DEFAULT NULL,
  `session` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `job_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `controller_stats_archive` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) DEFAULT NULL,
  `online` tinyint(1) DEFAULT '0',
  `clock` smallint(6) DEFAULT NULL,
  `hashrate` float DEFAULT NULL,
  `expected` float DEFAULT NULL,
  `accepted` bigint(20) DEFAULT NULL,
  `rejected` bigint(20) DEFAULT NULL,
  `hwe` float DEFAULT NULL,
  `pdn` int(11) DEFAULT NULL,
  `diff` int(11) DEFAULT NULL,
  `uptime` int(11) DEFAULT NULL,
  `session` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `job_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `controllers` (
  `id` int(11) NOT NULL,
  `worker` varchar(45) DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `barcode` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `jobs` (
  `job_id` int(11) NOT NULL AUTO_INCREMENT,
  `date` datetime DEFAULT NULL,
  `hashrate` float DEFAULT NULL,
  `eff` float DEFAULT NULL,
  `expected` float DEFAULT NULL,
  PRIMARY KEY (`job_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
