use bollard::models::{ContainerSummary, ImageSummary, Volume, Network};

fn check(c: ContainerSummary, i: ImageSummary, v: Volume, n: Network) {
    let _ = c.created;
    let _ = c.network_settings;
    let _ = i.containers; // Is this available?
    let _ = i.labels;
    let _ = v.usage_data;
    let _ = n.ipam;
    let _ = n.attachable;
}
