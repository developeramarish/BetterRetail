﻿using System;
using System.Collections.Generic;
using System.Globalization;
using Orckestra.Composer.Store.Models;

namespace Orckestra.Composer.Store.Parameters
{
    public class GetStoreLocatorViewModelParam
    {
        public string Scope { get; set; }
        public CultureInfo CultureInfo { get; set; }
        public string BaseUrl { get; set; }
        public Bounds MapBounds { get; set; }
        public int ZoomLevel { get; set; }
        public Coordinate SearchPoint { get; set; }
        public bool IncludeMarkers { get; set; } = false;
        public int PageSize { get; set; }
        public int PageNumber { get; set; }
    }
}
