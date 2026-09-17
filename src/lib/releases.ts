export type CurrentVersion = {
  date: string;
  version: string;
  url: string;
  pg: string;
  highlight: boolean;
};

export type HistoricalVersion = {
  date: string;
  version: string;
  url: string;
};

export const CURRENT_VERSIONS: CurrentVersion[] = [
  {
    date: "Sep 17, 2026",
    version: "IvorySQL 5.6 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v5.6/1.html",
    pg: "PostgreSQL 18.6",
    highlight: true,
  },
  {
    date: "Jul 27, 2026",
    version: "IvorySQL 1.23 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.23/v1.23/1.html",
    pg: "PostgreSQL 14",
    highlight: false,
  },
];

export const HISTORICAL_VERSIONS: HistoricalVersion[] = [
  {
    date: "Jun 17, 2026",
    version: "IvorySQL 5.4 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v5.4/v5.4/1.html",
  },
  {
    date: "Apr 21, 2026",
    version: "IvorySQL 1.22 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.22/v1.22/1.html",
  },
  {
    date: "Mar 12, 2026",
    version: "IvorySQL 5.3 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v5.3/v5.3/1.html",
  },
  {
    date: "Dec 18, 2025",
    version: "IvorySQL 5.1 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v5.1/v5.1/1.html",
  },
  {
    date: "Nov 25, 2025",
    version: "IvorySQL 5.0 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v5.0/v5.0/1.html",
  },
  {
    date: "Sep 10, 2025",
    version: "IvorySQL 4.6 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v4.6/v4.6/1.html",
  },
  {
    date: "Jun 4, 2025",
    version: "IvorySQL 4.5 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v4.5/v4.5/1.html",
  },
  {
    date: "Mar 26, 2025",
    version: "IvorySQL 1.17 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.17/v1.17/1.html",
  },
  {
    date: "Mar 10, 2025",
    version: "IvorySQL 4.4 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v4.4/v4.4/1.html",
  },
  {
    date: "Jan 13, 2025",
    version: "IvorySQL 4.2 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v4.2/v4.2/1.html",
  },
  {
    date: "Dec 23, 2024",
    version: "IvorySQL 4.0 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v4.0/v4.0/1.html",
  },
  {
    date: "Nov 21, 2024",
    version: "IvorySQL 1.8 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.8/v1.8/1.html",
  },
  {
    date: "Sep 26, 2024",
    version: "IvorySQL 3.4 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v3.4/v3.4/1.html",
  },
  {
    date: "Jul 11, 2024",
    version: "IvorySQL 3.3 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v3.3/v3.3/1.html",
  },
  {
    date: "Apr 11, 2024",
    version: "IvorySQL 3.2 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v3.2/v3.2/1.html",
  },
  {
    date: "Jan 26, 2024",
    version: "IvorySQL 3.1 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v3.1/v3.1/1.html",
  },
  {
    date: "Nov 17, 2023",
    version: "IvorySQL 3.0 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v3.0/v3.0/1.html",
  },
  {
    date: "Jun 28, 2023",
    version: "IvorySQL 2.3 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v2.3/v2.3/1.html",
  },
  {
    date: "Mar 29, 2023",
    version: "IvorySQL 2.2 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v2.2/v2.2/1.html",
  },
  {
    date: "Dec 14, 2022",
    version: "IvorySQL 2.1 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v2.1/v2.1/1.html",
  },
  {
    date: "Sep 09, 2022",
    version: "IvorySQL 1.5 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.5/v1.5/1.html",
  },
  {
    date: "Jun 28, 2022",
    version: "IvorySQL 1.4 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.4/v1.4/1.html",
  },
  {
    date: "May 27, 2022",
    version: "IvorySQL 1.3 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.3/v1.3/1.html",
  },
  {
    date: "Feb 28, 2022",
    version: "IvorySQL 1.2 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.2/v1.2/1.html",
  },
  {
    date: "Jan 25, 2022",
    version: "IvorySQL 1.1 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.1/v1.1/1.html",
  },
  {
    date: "Dec 15, 2021",
    version: "IvorySQL 1.0 STABLE",
    url: "https://docs.ivorysql.org/en/ivorysql-doc/v1.0/v1.0/1.html",
  },
];
