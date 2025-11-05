//! Neural network model for next-vector prediction

use anyhow::Result;
use candle_nn::{linear, Module, VarBuilder, Linear};
use candle_core::Tensor;

/// Simple MLP for next-vector prediction in continuous space
pub struct NextVec {
    w1: Linear,
    w2: Linear,
    dim: usize,
}

impl NextVec {
    /// Create new model with given dimensions
    pub fn new(vb: &VarBuilder, dim: usize, hidden: usize) -> Result<Self> {
        let w1 = linear(dim, hidden, vb.pp("w1"))?;
        let w2 = linear(hidden, dim, vb.pp("w2"))?;
        Ok(Self { w1, w2, dim })
    }

    /// Forward pass: z_t -> z_{t+1}
    pub fn forward(&self, z: &Tensor) -> Result<Tensor> {
        let h = self.w1.forward(z)?.relu()?;
        self.w2.forward(&h)
    }

    /// Get model dimension
    pub fn dim(&self) -> usize {
        self.dim
    }
}

/// Compute cosine similarity between two tensors
pub fn cosine(a: &Tensor, b: &Tensor) -> Result<Tensor> {
    let adotb = (a * b)?.sum_all()?;
    let an = a.sqr()?.sum_all()?.sqrt()?;
    let bn = b.sqr()?.sum_all()?.sqrt()?;
    Ok((adotb / (an * bn)?)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use candle_core::{Device, DType};

    #[test]
    fn test_model_creation() {
        let device = Device::Cpu;
        let vb = VarBuilder::from_varmap(&candle_nn::VarMap::new(), DType::F32, &device);
        let model = NextVec::new(&vb, 128, 256).unwrap();
        assert_eq!(model.dim(), 128);
    }

    #[test]
    fn test_forward_pass() {
        let device = Device::Cpu;
        let dim = 64;
        let vb = VarBuilder::from_varmap(&candle_nn::VarMap::new(), DType::F32, &device);
        let model = NextVec::new(&vb, dim, 128).unwrap();

        let input = Tensor::zeros(dim, DType::F32, &device).unwrap();
        let output = model.forward(&input).unwrap();

        assert_eq!(output.dims(), &[dim]);
    }
}
