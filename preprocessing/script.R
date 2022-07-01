# setup ====================================================================

#setwd("D:/Documents/Studium/MSc Medieninformatik/10_Sommersemester_2022/GZ - Graphenzeichnen")
setwd("D:/Documents/Studium/MSc Medieninformatik/10_Sommersemester_2022/GZ - Graphenzeichnen/partitura d'opera")

library(tidyverse)
library(gridExtra)
library(ggplot2)
library(ggsci)
library(sf)
library(mapview)
library(ggmap)

# read the data and rename (as not found by geocoding)
opera_data <- read.csv(file = 'preprocessing/opera_performances_200_contest.csv')
opera_data$rism_id <- NULL
opera_data[opera_data$placename == "Carskoe Selo","placename"] <- "Puschkin"

# TODO: sort composer before constructing the respective map
# this was done by hand, sorted by first year then length of years
sortedComposer <- c(1,7,3,2,5,4,0,9,6,8) 
# this was done by hand, sorted by first year then descending(!) length of years
sortedComposer <- c(2,7,0,1,6,4,3,9,5,8) 
names(sortedComposer) <- unique(opera_data$composer)
opera_data$composerMap <- as.integer(factor(opera_data$composer, levels = names(sort(sortedComposer))))
# unsorted
# opera_data$composerMap <- as.integer(as.factor(opera_data$composer))

# get the other maps
# TODO: sort them as well?!
opera_data$librettistMap <- as.integer(as.factor(opera_data$librettist))
opera_data$placenameMap <- as.integer(as.factor(opera_data$placename))
opera_data$operaMap <- as.integer(as.factor(opera_data$placename))

# data examination ====================================================================

# look at the data
# !!! there are more than 67 operas, as some have the same title but different composers
# !!! the time period of the data spans 58 years, in 7 years were 0 shows
#composer librettist title performance_year placename
#10          8    67               51        43
opera_data %>% 
  summarise_all(n_distinct)

# add a column for unique operas
#opera_data <- opera_data %>% 
#  group_by(composer, title) %>%
#  mutate(opera=paste(substring(word(composer,1),1, nchar(word(composer,1))-1),"-",title)) %>%
#  ungroup()
#opera_data %>% 
#  summarise_all(n_distinct)

# per composer info
write.csv(opera_data %>% 
  group_by(composer) %>% 
  summarise(n_shows=n(), 
            n_distinct_operas=n_distinct(title)) %>%
  arrange(desc(n_shows)),
"data/per_composer_info.csv", row.names=FALSE)

# per opera info
write.csv(opera_data %>%
  group_by(composer, title) %>% 
  summarise(n_shows=n(), 
            n_distinct_places=n_distinct(placename),
            n_distinct_librettist=n_distinct(librettist)) %>%
  arrange(desc(n_shows)),
  "data/per_opera_info.csv", row.names=FALSE)

# per librettist info
write.csv(opera_data %>% 
  group_by(librettist) %>% 
  summarise(n_shows=n(), 
            n_distinct_composers=n_distinct(composer), 
            n_distinct_operas=n_distinct(composer,title), 
            n_distinct_title=n_distinct(title)) %>%
  arrange(desc(n_shows)),
"data/per_librettist_info.csv", row.names=FALSE, quote=FALSE)

# per place info
write.csv(opera_data %>%
  group_by(placename) %>% 
  summarise(n_shows=n(), 
            n_distinct_composers=n_distinct(composer)) %>%
  arrange(desc(n_shows)),
"data/per_place_info.csv", row.names=FALSE, quote=FALSE)

# per title info
write.csv(opera_data %>% 
  group_by(title) %>% 
  summarise(n_shows=n(), 
            n_distinct_composers=n_distinct(composer),
            n_distinct_places=n_distinct(placename),
            n_distinct_librettist=n_distinct(librettist)) %>%
  arrange(desc(n_distinct_librettist)),
"data/per_title_info.csv", row.names=FALSE, quote=FALSE)

# number of shows per (place - opera)
opera_data %>% 
  group_by(placename, composer, title) %>% 
  count() %>% 
  arrange(desc(n))

df2 <- opera_data %>% group_by(placename) %>% mutate(different_operas_in_place = n()) %>% arrange(desc(different_operas_in_place))
#ggplot(ntp, 
#       aes(placename,n)) +
#  geom_bar()
  #stat_count(width = 0.5)
  #geom_bar()
  #geom_histogram(binwidth=1, stat="count")
  #scale_fill_tron() +
  #labs(title="Opera Shows", subtitle=name, x="Year", y="Count", fill="Opera")  +
  #coord_cartesian(xlim=duration)
ggplot(opera_data, 
       aes(performance_year, fill=composer)) +
  geom_histogram(binwidth=1)

# individual information about mozart
#mozart <- opera_data[opera_data$composer=="Mozart, Wolfgang Amadeus",]
#mozart$composer <- NULL
#mozart <- mozart[order(mozart$performance_year),]
#m <- mozart%>%group_by(performance_year)%>%summarise(n=n())

# data plotting ===========================================================

# colors from https://www.datanovia.com/en/blog/top-r-color-palettes-to-know-for-great-data-visualization
# base rainbow(), heat/terrain/topo/cm.colors()
# ggsci npg/aaas/lancet/jco/tron()
duration <- c(min(opera_data$performance_year), max(opera_data$performance_year))

plot_all <- function(dat) {
  ggplot(dat, 
         aes(performance_year, fill=composer)) +
    geom_histogram(binwidth=1) +
    #scale_fill_tron() +
    scale_fill_manual(values = alpha(rainbow(10), 0.5)) +
    labs(title="Opera Performances", x="Year", y="Count", fill="Opera")
}

plot_all_colour <- function(dat) {
  ggplot(dat, 
         aes(performance_year, colour=composer)) +
    geom_histogram(binwidth=1) +
    #scale_fill_tron() +
    scale_colour_manual(values = rainbow(10)) +
    labs(title="Opera Shows", x="Year", y="Count", fill="Opera")
}

plot_composer <- function(dat, name) {
  ggplot(dat[dat$composer==name,], 
         aes(performance_year, fill=title)) +
    geom_histogram(binwidth=1) +
    #scale_fill_tron() +
    labs(title="Opera Shows", subtitle=name, x="Year", y="Count", fill="Opera")  +
    coord_cartesian(xlim=duration)
}

plot_composer_slim <- function(dat, name) {
  ggplot(dat[dat$composer==name,], 
         aes(performance_year, fill=title)) +
    geom_histogram(binwidth=5) +
    labs(subtitle=name, x="", y="")  +
    coord_cartesian(xlim=duration) +
    theme(legend.position="none") +
    theme(axis.title.x=element_blank(),
          axis.text.x=element_blank(),
          axis.ticks.x=element_blank(),
          axis.title.y=element_blank(),
          axis.text.y=element_blank(),
          axis.ticks.y=element_blank())
}

# plot all shows
plot_all(opera_data)
plot_all_colour(opera_data)

# plot all composers individually, to see the timely relations
p1 <- plot_composer_slim(opera_data, "Paisiello, Giovanni")
p2 <- plot_composer_slim(opera_data, "Mayr, Johann Simon")
p3 <- plot_composer_slim(opera_data, "Anfossi, Pasquale")
p4 <- plot_composer_slim(opera_data, "Piccinni, Niccol?")
p5 <- plot_composer_slim(opera_data, "Cimarosa, Domenico")
p6 <- plot_composer_slim(opera_data, "Salieri, Antonio")
p7 <- plot_composer_slim(opera_data, "Mozart, Wolfgang Amadeus")
p8 <- plot_composer_slim(opera_data, "Meyerbeer, Giacomo")
p9 <- plot_composer_slim(opera_data, "Mart?n y Soler, Vicente")
p10 <- plot_composer_slim(opera_data, "Rossini, Gioachino")
grid.arrange(p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,nrow=3)

# plot single composers
plot_composer(opera_data, "Mozart, Wolfgang Amadeus")
plot_composer(opera_data, "Rossini, Gioachino")
plot_composer(opera_data, "Anfossi, Pasquale")
#plot(mozart%>%summarise(n),mozart$performance_year)

# counting data pairs =========================

# ideas:
# 10 composers            ->  colors for each composer
# 8 librettist            ->  symbol for each librettist
# 77 composer-title-pairs ->  color gradient

pairs <- function(a,b) {
  opera_data %>%
    group_by({{a}},{{b}}) %>%
    summarise()
}

# composer-title pairs [77]
ct <- pairs(composer, title)
# composer-librettist pairs [28]
cl <- pairs(composer, librettist)
# title-librettist pairs [69]
tl <- pairs(title, librettist)
# composer-placename pairs [107]
cp <- pairs(composer, placename)
# librettist-placename pairs [94]
lp <- pairs(librettist, placename)
# composer-performance_year pairs [126]
cy <- pairs(composer, performance_year)

# geocoding: data preprocessing ============================================
# https://www.geoapify.com/tools/geocoding-online

# get the cities/places
places <- distinct(opera_data, placename)
places <- places[places!=""] # remove empty rows
places <- data.frame(places)
places <- rename(places,city=places)

# extend dataframe for geocoding
column_names <- c("housenumber", "street", "postcode", "city", "state")
remaining_column_names <- c("housenumber", "street", "postcode", "state")
for (name in remaining_column_names)
  places[,name] <- NA
places <- places[column_names]

# add countries
#places$city
#[1] "Sankt Petersburg"  "Venezia"           "Dresden"           "Hamburg"          
#[5] "Padova"            "Napoli"            "Roma"              "Bologna"          
#[9] "Torino"            "Weimar"            "Bonn"              "Paris"            
#[13] "Braunschweig"      "Wien"              "Genova"            "Breslau"          
#[17] "Donaueschingen"    "Osnabr?ck"         "Dessau"            "Praha"            
#[21] "Amsterdam"         "Verona"            "Valletta"          "Milano"           
#[25] "Ravenna"           "Frankfurt am Main" "Leipzig"           "Pillnitz"         
#[29] "Detmold"           "Carskoe Selo"      "Firenze"           "Graz"             
#[33] "Castelnuovo"       "Salzburg"          "Regensburg"        "Vicenza"          
#[37] "Hannover"          "Bad Lauchst?dt"    "Karlsruhe"         "London"           
#[41] "Udine"             "Potsdam"           "Faenza"       
places$country <- c("Russland", "Italien", "Deutschland", "Deutschland", 
               "Italien", "Italien", "Italien", "Italien", 
               "Italien", "Deutschland", "Deutschland", "Frankreich", 
               "Deutschland", "Oesterreich", "Italien", "Polen",
               "Deutschland", "Deutschland", "Deutschalnd", "Tschechien", 
               "Niederlande", "Italien", "Malta", "Italien",
               "Italien", "Deutschland", "Deutschland", "Deutschland",
               "Deutschland", "Russland", "Italien", "Oesterreich", 
               "Italien", "Oesterreich", "Deutschland", "Italien",
               "Deutschland", "Deutschland", "Deutschland", "England",
               "Italien", "Deutschland", "Italien")

write.csv(places, "preprocessing/places_to_geocode.csv", row.names=FALSE, quote=FALSE)

placesMap <- places[c("city", "country")]

library(plyr)
opera_data$country <- mapvalues(opera_data$placename, from=placesMap$city, to=placesMap$country)

# geocoding: data postprocessing ==============================================

geo_data <- read.csv("preprocessing/places_geocoded_full.csv")
geo_data <- geo_data[c("original_city","lon","lat")]
write.csv(geo_data, "preprocessing/places_geocoded.csv", row.names=FALSE, quote=FALSE)

# geocoding: visualization ================================================

#g <- read_sf("places_geocoded.csv")
#mapview(geo_data, zcol="original_city")

# write dataframe
write.csv(opera_data,"data/opera_data.csv", row.names = FALSE)

